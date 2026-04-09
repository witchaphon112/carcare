using carwash.Application.Fureture.Queue.Dto;
using carwash.Domain.Model;
using carwash.Migrations.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace CarWash.API.Controller;

[ApiController]
[Route("api/[controller]")]
public sealed class QueueController(CarWashDbContext dbContext) : ControllerBase
{
    private const int MinutesPerQueue = 50;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<QueueDto>>> GetQueuesAsync(CancellationToken cancellationToken)
    {
        var queues = await dbContext.Queues
            .AsNoTracking()
            .Select(MapQueueDto())
            .ToListAsync(cancellationToken);

        return Ok(queues.OrderBy(x => ExtractQueueNumber(x.QueueId)).ToList());
    }

    [HttpGet("latest")]
    public async Task<ActionResult<QueueDto>> GetLatestQueueAsync(CancellationToken cancellationToken)
    {
        var latestQueue = await dbContext.Queues
            .AsNoTracking()
            .Select(MapQueueDto())
            .OrderByDescending(x => x.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (latestQueue is null)
        {
            return NotFound();
        }

        return Ok(latestQueue);
    }

    [HttpPost]
    public async Task<ActionResult<QueueDto>> AddQueueAsync(
        [FromBody] CreateQueueRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest("Request body is required.");
        }

        if (string.IsNullOrWhiteSpace(request.QueueCar))
        {
            return BadRequest("QueueCar is required.");
        }

        if (!TryParseShopStatus(request.ShopStatus, out var shopStatus))
        {
            return BadRequest("ShopStatus must be Open, Busy, or Closed.");
        }

        if (!TryParseQueueStatus(request.QueueStatus, out var queueStatus))
        {
            return BadRequest("QueueStatus must be Waiting, InProgress, Completed, or Cancelled.");
        }

        var queueCount = await dbContext.Queues.CountAsync(cancellationToken);
        var queueId = string.IsNullOrWhiteSpace(request.QueueId)
            ? await GetNextQueueIdAsync(cancellationToken)
            : request.QueueId.Trim();
        var waitTime = request.WaitTime ?? (queueCount * MinutesPerQueue);

        var queue = new Queue
        {
            QueueId = queueId,
            QueueCar = request.QueueCar.Trim(),
            WaitTime = waitTime,
            TotalAmount = request.TotalAmount,
            ShopStatus = shopStatus,
            QueueStatus = queueStatus
        };

        dbContext.Queues.Add(queue);
        await dbContext.SaveChangesAsync(cancellationToken);
        await RecalculateActiveQueueOrderAsync(cancellationToken);

        var savedQueue = await dbContext.Queues.AsNoTracking().FirstAsync(x => x.Id == queue.Id, cancellationToken);
        return Ok(MapQueueDtoValue(savedQueue));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<QueueDto>> UpdateQueueAsync(
        Guid id,
        [FromBody] UpdateQueueRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
        {
            return BadRequest("Request body is required.");
        }

        var queue = await dbContext.Queues.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (queue is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(request.QueueId))
        {
            queue.QueueId = request.QueueId.Trim();
        }

        if (!string.IsNullOrWhiteSpace(request.QueueCar))
        {
            queue.QueueCar = request.QueueCar.Trim();
        }

        if (request.WaitTime.HasValue)
        {
            queue.WaitTime = request.WaitTime.Value;
        }

        if (request.TotalAmount.HasValue)
        {
            queue.TotalAmount = request.TotalAmount.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.ShopStatus))
        {
            if (!TryParseShopStatus(request.ShopStatus, out var shopStatus))
            {
                return BadRequest("ShopStatus must be Open, Busy, or Closed.");
            }

            queue.ShopStatus = shopStatus;
        }

        if (!string.IsNullOrWhiteSpace(request.QueueStatus))
        {
            if (!TryParseQueueStatus(request.QueueStatus, out var queueStatus))
            {
                return BadRequest("QueueStatus must be Waiting, InProgress, Completed, or Cancelled.");
            }

            queue.QueueStatus = queueStatus;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await RecalculateActiveQueueOrderAsync(cancellationToken);

        var updatedQueue = await dbContext.Queues.AsNoTracking().FirstAsync(x => x.Id == id, cancellationToken);
        return Ok(MapQueueDtoValue(updatedQueue));
    }

    [HttpPatch("{id:guid}/shop-status")]
    public async Task<ActionResult<QueueDto>> UpdateQueueShopStatusAsync(
        Guid id,
        [FromBody] UpdateQueueShopStatusRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.ShopStatus))
        {
            return BadRequest("ShopStatus is required.");
        }

        if (!TryParseShopStatus(request.ShopStatus, out var shopStatus))
        {
            return BadRequest("ShopStatus must be Open, Busy, or Closed.");
        }

        var queue = await dbContext.Queues.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (queue is null)
        {
            return NotFound();
        }

        queue.ShopStatus = shopStatus;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(MapQueueDtoValue(queue));
    }

    [HttpPatch("{id:guid}/queue-status")]
    public async Task<ActionResult<QueueDto>> UpdateQueueStatusAsync(
        Guid id,
        [FromBody] UpdateQueueStatusRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.QueueStatus))
        {
            return BadRequest("QueueStatus is required.");
        }

        if (!TryParseQueueStatus(request.QueueStatus, out var queueStatus))
        {
            return BadRequest("QueueStatus must be Waiting, InProgress, Completed, or Cancelled.");
        }

        var queue = await dbContext.Queues.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (queue is null)
        {
            return NotFound();
        }

        queue.QueueStatus = queueStatus;
        await dbContext.SaveChangesAsync(cancellationToken);
        await RecalculateActiveQueueOrderAsync(cancellationToken);

        var updatedQueue = await dbContext.Queues.AsNoTracking().FirstAsync(x => x.Id == id, cancellationToken);
        return Ok(MapQueueDtoValue(updatedQueue));
    }

    [HttpPost("recalculate")]
    public async Task<ActionResult<IReadOnlyList<QueueDto>>> RecalculateQueuesAsync(CancellationToken cancellationToken)
    {
        await RecalculateActiveQueueOrderAsync(cancellationToken);

        var queues = await dbContext.Queues
            .AsNoTracking()
            .Select(MapQueueDto())
            .ToListAsync(cancellationToken);

        return Ok(queues.OrderBy(x => ExtractQueueNumber(x.QueueId)).ToList());
    }

    private static bool TryParseShopStatus(string? rawStatus, out ShopStatus shopStatus)
    {
        if (string.IsNullOrWhiteSpace(rawStatus))
        {
            shopStatus = ShopStatus.Open;
            return true;
        }

        return Enum.TryParse(rawStatus, ignoreCase: true, out shopStatus);
    }

    private static bool TryParseQueueStatus(string? rawStatus, out QueueStatus queueStatus)
    {
        if (string.IsNullOrWhiteSpace(rawStatus))
        {
            queueStatus = QueueStatus.Waiting;
            return true;
        }

        return Enum.TryParse(rawStatus, ignoreCase: true, out queueStatus);
    }

    private async Task<string> GetNextQueueIdAsync(CancellationToken cancellationToken)
    {
        var queueIds = await dbContext.Queues
            .AsNoTracking()
            .Where(x => x.QueueStatus == QueueStatus.Waiting || x.QueueStatus == QueueStatus.InProgress)
            .Select(x => x.QueueId)
            .ToListAsync(cancellationToken);

        var nextNumber = queueIds
            .Select(ExtractQueueNumber)
            .DefaultIfEmpty(0)
            .Max() + 1;

        return nextNumber.ToString();
    }

    private static int ExtractQueueNumber(string? queueId)
    {
        if (string.IsNullOrWhiteSpace(queueId))
        {
            return 0;
        }

        var digits = new string(queueId.Where(char.IsDigit).ToArray());
        return int.TryParse(digits, out var number) ? number : 0;
    }

    private async Task RecalculateActiveQueueOrderAsync(CancellationToken cancellationToken)
    {
        var activeQueues = await dbContext.Queues
            .Where(x => x.QueueStatus == QueueStatus.Waiting || x.QueueStatus == QueueStatus.InProgress)
            .ToListAsync(cancellationToken);

        var orderedQueues = activeQueues
            .OrderBy(x => ExtractQueueNumber(x.QueueId))
            .ThenBy(x => x.Id)
            .ToList();

        for (var index = 0; index < orderedQueues.Count; index++)
        {
            orderedQueues[index].QueueId = (index + 1).ToString();
            orderedQueues[index].WaitTime = index * MinutesPerQueue;
        }

        var inactiveQueues = await dbContext.Queues
            .Where(x => x.QueueStatus != QueueStatus.Waiting && x.QueueStatus != QueueStatus.InProgress)
            .ToListAsync(cancellationToken);

        foreach (var queue in inactiveQueues)
        {
            queue.WaitTime = 0;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static bool IsActiveQueueStatus(QueueStatus queueStatus)
    {
        return queueStatus is QueueStatus.Waiting or QueueStatus.InProgress;
    }

    private static Expression<Func<Queue, QueueDto>> MapQueueDto()
    {
        return x => new QueueDto(
            x.Id,
            x.QueueId,
            x.QueueCar,
            x.WaitTime,
            x.TotalAmount,
            x.ShopStatus.ToString(),
            x.QueueStatus.ToString());
    }

    private static QueueDto MapQueueDtoValue(Queue queue)
    {
        return new QueueDto(
            queue.Id,
            queue.QueueId,
            queue.QueueCar,
            queue.WaitTime,
            queue.TotalAmount,
            queue.ShopStatus.ToString(),
            queue.QueueStatus.ToString());
    }

    public sealed record CreateQueueRequest(
        string? QueueId,
        string QueueCar,
        int? WaitTime,
        decimal TotalAmount,
        string? ShopStatus = null,
        string? QueueStatus = null);

    public sealed record UpdateQueueRequest(
        string? QueueId = null,
        string? QueueCar = null,
        int? WaitTime = null,
        decimal? TotalAmount = null,
        string? ShopStatus = null,
        string? QueueStatus = null);

    public sealed record UpdateQueueShopStatusRequest(string ShopStatus);

    public sealed record UpdateQueueStatusRequest(string QueueStatus);
}
