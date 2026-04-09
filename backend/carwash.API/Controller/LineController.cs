using carwash.Application.Fureture.Line.Command;
using carwash.Application.Fureture.Queue.Dto;
using carwash.Domain.Enum;
using carwash.Domain.Model;
using carwash.Migrations.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace CarWash.API.Controller;

[ApiController]
[Route("api/[controller]")]
public sealed class LineController(
    IConfiguration configuration,
    IWebHostEnvironment environment,
    CarWashDbContext dbContext,
    ILogger<LineController> logger,
    CreateLineRichMenuCommandHandler createLineRichMenuCommandHandler,
    UploadLineRichMenuImageCommandHandler uploadLineRichMenuImageCommandHandler,
    AssignLineRichMenuCommandHandler assignLineRichMenuCommandHandler,
    ReplyLineMapCardCommandHandler replyLineMapCardCommandHandler,
    ReplyLineQueueCardCommandHandler replyLineQueueCardCommandHandler,
    ReplyLineServiceImageCommandHandler replyLineServiceImageCommandHandler) : ControllerBase
{
    [HttpPost("richmenu")]
    public async Task<ActionResult<CreateLineRichMenuResult>> CreateRichMenuAsync(
        [FromBody] CreateRichMenuRequest? request,
        CancellationToken cancellationToken)
    {
        var channelAccessToken = configuration["LineMessageApi:ChannelAccessToken"];
        if (string.IsNullOrWhiteSpace(channelAccessToken))
        {
            return Problem(
                title: "LINE channel access token is missing.",
                detail: "Set LineMessageApi:ChannelAccessToken in appsettings before calling this endpoint.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        var command = new CreateLineRichMenuCommand(
            ChannelAccessToken: channelAccessToken,
            Name: request?.Name ?? "carcare-main-richmenu",
            ChatBarText: request?.ChatBarText ?? "เมนู CarCare",
            Selected: request?.Selected ?? true,
            Areas: request?.Areas?.Select(MapArea).ToArray());

        try
        {
            var result = await createLineRichMenuCommandHandler.HandleAsync(command, cancellationToken);
            return Ok(result);
        }
        catch (HttpRequestException exception)
        {
            return Problem(
                title: "Failed to create LINE rich menu.",
                detail: exception.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
        catch (Exception exception) when (
            exception is ArgumentException or
            ArgumentOutOfRangeException or
            InvalidOperationException or
            NotSupportedException)
        {
            return Problem(
                title: "Invalid rich menu payload.",
                detail: exception.Message,
                statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("richmenu/{richMenuId}/content")]
    public async Task<ActionResult<UploadLineRichMenuImageResult>> UploadRichMenuImageAsync(
        string richMenuId,
        [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        var channelAccessToken = configuration["LineMessageApi:ChannelAccessToken"];
        if (string.IsNullOrWhiteSpace(channelAccessToken))
        {
            return Problem(
                title: "LINE channel access token is missing.",
                detail: "Set LineMessageApi:ChannelAccessToken in appsettings before calling this endpoint.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        byte[] content;
        string contentType;

        if (file is not null)
        {
            if (file.Length == 0)
            {
                return Problem(
                    title: "Image file is missing.",
                    detail: "Upload a non-empty PNG or JPEG file in the form field named 'file'.",
                    statusCode: StatusCodes.Status400BadRequest);
            }

            await using var stream = file.OpenReadStream();
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream, cancellationToken);
            content = memoryStream.ToArray();
            contentType = file.ContentType;
        }
        else
        {
            var imagePath = Path.Combine(environment.ContentRootPath, "Aseests", "Line", "RichmenuV1-small.jpg");
            if (!System.IO.File.Exists(imagePath))
            {
                return Problem(
                    title: "Rich menu image file was not found.",
                    detail: $"Expected file at '{imagePath}'.",
                    statusCode: StatusCodes.Status404NotFound);
            }

            content = await System.IO.File.ReadAllBytesAsync(imagePath, cancellationToken);
            contentType = "image/jpeg";
        }

        var command = new UploadLineRichMenuImageCommand(
            ChannelAccessToken: channelAccessToken,
            RichMenuId: richMenuId,
            Content: content,
            ContentType: contentType);

        try
        {
            var result = await uploadLineRichMenuImageCommandHandler.HandleAsync(command, cancellationToken);
            return Ok(result);
        }
        catch (HttpRequestException exception)
        {
            return Problem(
                title: "Failed to upload LINE rich menu image.",
                detail: exception.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
        catch (Exception exception) when (
            exception is ArgumentException or
            InvalidOperationException or
            NotSupportedException)
        {
            return Problem(
                title: "Invalid rich menu image payload.",
                detail: exception.Message,
                statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("richmenu/{richMenuId}/content/default")]
    public async Task<ActionResult<UploadLineRichMenuImageResult>> UploadDefaultRichMenuImageAsync(
        string richMenuId,
        CancellationToken cancellationToken)
    {
        var channelAccessToken = configuration["LineMessageApi:ChannelAccessToken"];
        if (string.IsNullOrWhiteSpace(channelAccessToken))
        {
            return Problem(
                title: "LINE channel access token is missing.",
                detail: "Set LineMessageApi:ChannelAccessToken in appsettings before calling this endpoint.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        var imagePath = Path.Combine(environment.ContentRootPath, "Aseests", "Line", "RichmenuV1-small.jpg");
        if (!System.IO.File.Exists(imagePath))
        {
            return Problem(
                title: "Rich menu image file was not found.",
                detail: $"Expected file at '{imagePath}'.",
                statusCode: StatusCodes.Status404NotFound);
        }

        var content = await System.IO.File.ReadAllBytesAsync(imagePath, cancellationToken);
        var command = new UploadLineRichMenuImageCommand(
            ChannelAccessToken: channelAccessToken,
            RichMenuId: richMenuId,
            Content: content,
            ContentType: "image/jpeg");

        try
        {
            var result = await uploadLineRichMenuImageCommandHandler.HandleAsync(command, cancellationToken);
            return Ok(result);
        }
        catch (HttpRequestException exception)
        {
            return Problem(
                title: "Failed to upload LINE rich menu image.",
                detail: exception.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
        catch (Exception exception) when (
            exception is ArgumentException or
            InvalidOperationException or
            NotSupportedException)
        {
            return Problem(
                title: "Invalid rich menu image payload.",
                detail: exception.Message,
                statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("richmenu/{richMenuId}/default")]
    public async Task<ActionResult<AssignLineRichMenuResult>> AssignDefaultRichMenuAsync(
        string richMenuId,
        CancellationToken cancellationToken)
    {
        return await AssignRichMenuInternalAsync(richMenuId, userId: null, cancellationToken);
    }

    [HttpPost("richmenu/{richMenuId}/users/{userId}")]
    public async Task<ActionResult<AssignLineRichMenuResult>> AssignUserRichMenuAsync(
        string richMenuId,
        string userId,
        CancellationToken cancellationToken)
    {
        return await AssignRichMenuInternalAsync(richMenuId, userId, cancellationToken);
    }

    private async Task<ActionResult<AssignLineRichMenuResult>> AssignRichMenuInternalAsync(
        string richMenuId,
        string? userId,
        CancellationToken cancellationToken)
    {
        var channelAccessToken = configuration["LineMessageApi:ChannelAccessToken"];
        if (string.IsNullOrWhiteSpace(channelAccessToken))
        {
            return Problem(
                title: "LINE channel access token is missing.",
                detail: "Set LineMessageApi:ChannelAccessToken in appsettings before calling this endpoint.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        var command = new AssignLineRichMenuCommand(
            ChannelAccessToken: channelAccessToken,
            RichMenuId: richMenuId,
            UserId: userId);

        try
        {
            var result = await assignLineRichMenuCommandHandler.HandleAsync(command, cancellationToken);
            return Ok(result);
        }
        catch (HttpRequestException exception)
        {
            return Problem(
                title: "Failed to assign LINE rich menu.",
                detail: exception.Message,
                statusCode: StatusCodes.Status502BadGateway);
        }
        catch (Exception exception) when (exception is ArgumentException or InvalidOperationException)
        {
            return Problem(
                title: "Invalid rich menu assignment payload.",
                detail: exception.Message,
                statusCode: StatusCodes.Status400BadRequest);
        }
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> WebhookAsync(CancellationToken cancellationToken)
    {
        var channelSecret = configuration["LineMessageApi:ChannelSecret"];
        var signature = Request.Headers["x-line-signature"].ToString();
        if (string.IsNullOrWhiteSpace(channelSecret) || string.IsNullOrWhiteSpace(signature))
        {
            return Unauthorized();
        }

        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var body = await reader.ReadToEndAsync(cancellationToken);

        if (!IsValidSignature(body, channelSecret, signature))
        {
            return Unauthorized();
        }

        var webhook = JsonSerializer.Deserialize<LineWebhookRequest>(body, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (webhook?.Events is null || webhook.Events.Count == 0)
        {
            return Ok();
        }

        var channelAccessToken = configuration["LineMessageApi:ChannelAccessToken"];
        if (string.IsNullOrWhiteSpace(channelAccessToken))
        {
            return Problem(
                title: "LINE channel access token is missing.",
                detail: "Set LineMessageApi:ChannelAccessToken in appsettings before calling this endpoint.",
                statusCode: StatusCodes.Status500InternalServerError);
        }

        foreach (var lineEvent in webhook.Events)
        {
            if (string.IsNullOrWhiteSpace(lineEvent.ReplyToken))
            {
                continue;
            }

            if (ShouldReplyWithMapCard(lineEvent))
            {
                var mapCardContent = await GetMapCardContentAsync(cancellationToken);
                var command = new ReplyLineMapCardCommand(
                    ChannelAccessToken: channelAccessToken,
                    ReplyToken: lineEvent.ReplyToken,
                    Content: mapCardContent);

                await replyLineMapCardCommandHandler.HandleAsync(command, cancellationToken);
                continue;
            }

            if (ShouldReplyWithQueueCard(lineEvent))
            {
                var queueSummary = await GetQueueSummaryAsync(cancellationToken);
                var command = new ReplyLineQueueCardCommand(
                    ChannelAccessToken: channelAccessToken,
                    ReplyToken: lineEvent.ReplyToken,
                    Content: GetQueueCardContent(queueSummary));

                await replyLineQueueCardCommandHandler.HandleAsync(command, cancellationToken);
                continue;
            }

            if (ShouldReplyWithServiceImage(lineEvent))
            {
                var serviceImageUrl = GetServiceImageUrl();
                if (string.IsNullOrWhiteSpace(serviceImageUrl))
                {
                    logger.LogWarning(
                        "Skipped LINE service image reply because no HTTPS image URL is available. Configure LineServiceImage:ImageUrl or run behind an HTTPS proxy.");
                    continue;
                }

                var command = new ReplyLineServiceImageCommand(
                    ChannelAccessToken: channelAccessToken,
                    ReplyToken: lineEvent.ReplyToken,
                    Content: new LineServiceImageContent(
                        OriginalContentUrl: serviceImageUrl,
                        PreviewImageUrl: serviceImageUrl));

                try
                {
                    await replyLineServiceImageCommandHandler.HandleAsync(command, cancellationToken);
                }
                catch (ArgumentException exception)
                {
                    logger.LogWarning(
                        exception,
                        "Skipped LINE service image reply because the image URL is invalid: {ImageUrl}",
                        serviceImageUrl);
                }
            }
        }

        return Ok();
    }

    [HttpGet("queue-summary")]
    public async Task<ActionResult<QueueSummaryDto>> GetQueueSummaryEndpointAsync(CancellationToken cancellationToken)
    {
        var queueSummary = await GetQueueSummaryAsync(cancellationToken);
        return Ok(queueSummary);
    }

    private static LineRichMenuAreaCommand MapArea(CreateRichMenuAreaRequest area)
    {
        return new LineRichMenuAreaCommand(
            X: area.X,
            Y: area.Y,
            Width: area.Width,
            Height: area.Height,
            Action: new LineRichMenuActionCommand(
                Type: area.Action.Type,
                Label: area.Action.Label,
                Data: area.Action.Data,
                Text: area.Action.Text,
                Uri: area.Action.Uri,
                DisplayText: area.Action.DisplayText));
    }

    private async Task<LineMapCardContent> GetMapCardContentAsync(CancellationToken cancellationToken)
    {
        var masterTypeValues = await GetMasterTypeValuesAsync(
            [(int)CarStore.PhoneNumber, (int)CarStore.Map],
            cancellationToken);

        var phoneNumber = masterTypeValues.GetValueOrDefault((int)CarStore.PhoneNumber)
            ?? configuration["LineMapCard:PhoneNumber"]
            ?? "+1 (555) 012-4400";
        var mapUrl = masterTypeValues.GetValueOrDefault((int)CarStore.Map)
            ?? configuration["LineMapCard:MapUrl"]
            ?? "https://maps.google.com";

        var heroImageUrl = configuration["LineMapCard:HeroImageUrl"];

        return new LineMapCardContent(
            Title: configuration["LineMapCard:Title"] ?? "AquaFlow CarWash",
            Description: configuration["LineMapCard:Description"] ?? "Experience the fluid difference in vehicle care.",
            AddressLabel: configuration["LineMapCard:AddressLabel"] ?? "OUR LOCATION",
            Address: configuration["LineMapCard:Address"] ?? "1224 Crystal Stream Blvd, Metro Heights, MH 40221",
            PhoneLabel: configuration["LineMapCard:PhoneLabel"] ?? "DIRECT LINE",
            PhoneNumber: phoneNumber,
            BusinessHours: configuration["LineMapCard:BusinessHours"] ?? "Mon-Sun: 8:00 AM - 9:00 PM",
            CallUrl: $"tel:{phoneNumber}",
            MapUrl: mapUrl,
            HeroImageUrl: string.IsNullOrWhiteSpace(heroImageUrl)
                ? GetPublicLineAssetUrl("store.png") ?? "https://placehold.co/1200x800/png?text=CarCare"
                : heroImageUrl,
            MapPreviewImageUrl: configuration["LineMapCard:MapPreviewImageUrl"] ?? "https://placehold.co/1200x630/png?text=Map");
    }

    private async Task<Dictionary<int, string?>> GetMasterTypeValuesAsync(
        IReadOnlyCollection<int> ids,
        CancellationToken cancellationToken)
    {
        if (ids.Count == 0)
        {
            return [];
        }

        try
        {
            var values = await dbContext.MasterTypes
                .AsNoTracking()
                .Where(x => ids.Contains(x.Id) && x.IsActive)
                .Select(x => new { x.Id, x.Value })
                .ToDictionaryAsync(x => x.Id, x => x.Value, cancellationToken);

            return values.ToDictionary(x => x.Key, x => (string?)x.Value);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Failed to load MasterType values for ids {MasterTypeIds}. Falling back to configuration.",
                string.Join(", ", ids));
            return [];
        }
    }

    private async Task<QueueSummaryDto> GetQueueSummaryAsync(CancellationToken cancellationToken)
    {
        try
        {
            var activeQueueQuery = dbContext.Queues
                .AsNoTracking()
                .Where(x => x.QueueStatus == QueueStatus.Waiting || x.QueueStatus == QueueStatus.InProgress);

            var latestQueue = await activeQueueQuery
                .OrderBy(x => x.WaitTime)
                .ThenBy(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            var queueCount = await activeQueueQuery.CountAsync(cancellationToken);

            if (latestQueue is null)
            {
                return CreateFallbackQueueSummary();
            }

            return new QueueSummaryDto(
                Id: latestQueue.Id,
                QueueId: latestQueue.QueueId,
                QueueCar: latestQueue.QueueCar,
                WaitTime: latestQueue.WaitTime,
                TotalAmount: latestQueue.TotalAmount,
                ShopStatus: GetShopStatusDisplayText(latestQueue.ShopStatus),
                QueueCount: queueCount);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Failed to load queue summary from database. Falling back to configuration values.");
            return CreateFallbackQueueSummary();
        }
    }

    private QueueSummaryDto CreateFallbackQueueSummary()
    {
        return new QueueSummaryDto(
            Id: Guid.Empty,
            QueueId: configuration["LineQueueCard:QueueNumber"] ?? "A12",
            QueueCar: configuration["LineQueueCard:VehicleName"] ?? "Toyota Hilux Revo",
            WaitTime: int.TryParse(configuration["LineQueueCard:EstimatedWaitMinutes"], out var waitTime) ? waitTime : 25,
            TotalAmount: 0m,
            ShopStatus: configuration["LineQueueCard:StatusValue"] ?? GetShopStatusDisplayText(ShopStatus.Open),
            QueueCount: 0);
    }

    private LineQueueCardContent GetQueueCardContent(QueueSummaryDto queueSummary)
    {
        const int estimatedMinutesPerCar = 50;
        var queueCountAhead = Math.Max(queueSummary.QueueCount - 1, 0);
        var estimatedWaitMinutes = queueCountAhead * estimatedMinutesPerCar;

        return new LineQueueCardContent(
            BadgeText: configuration["LineQueueCard:BadgeText"] ?? "LIVE STATUS",
            Title: configuration["LineQueueCard:Title"] ?? "EkKao Carcare",
            Subtitle: configuration["LineQueueCard:Subtitle"] ?? "คิวรถและเวลารอโดยประมาณ",
            QueueNumberLabel: configuration["LineQueueCard:QueueNumberLabel"] ?? "หมายเลขคิว",
            QueueNumber: queueSummary.QueueId,
            QueueCountAheadLabel: configuration["LineQueueCard:QueueCountAheadLabel"] ?? "คิวก่อนหน้า",
            QueueCountAhead: $"{queueCountAhead} คัน",
            EstimatedWaitLabel: configuration["LineQueueCard:EstimatedWaitLabel"] ?? "เวลารอคิว",
            EstimatedWaitMinutes: estimatedWaitMinutes.ToString(),
            StatusLabel: configuration["LineQueueCard:StatusLabel"] ?? "สถานะร้าน",
            StatusValue: queueSummary.ShopStatus,
            VehicleLabel: configuration["LineQueueCard:VehicleLabel"] ?? "คิวรถ",
            VehicleName: queueSummary.QueueCar,
            ServiceLabel: configuration["LineQueueCard:ServiceLabel"] ?? "SERVICE",
            ServiceName: $"ยอด {queueSummary.TotalAmount:N2} บาท",
            QueueUrl: configuration["LineQueueCard:QueueUrl"] ?? "https://example.com/queue",
            CallUrl: configuration["LineQueueCard:CallUrl"] ?? "tel:0999999999",
            HeroImageUrl: configuration["LineQueueCard:HeroImageUrl"] ?? "https://placehold.co/160/png?text=Car");
    }

    private static string GetShopStatusDisplayText(ShopStatus shopStatus)
    {
        return shopStatus switch
        {
            ShopStatus.Open => "กำลังให้บริการ",
            ShopStatus.Busy => "คิวแน่น",
            ShopStatus.Closed => "ปิดร้าน",
            _ => shopStatus.ToString()
        };
    }

    private static bool ShouldReplyWithMapCard(LineWebhookEvent lineEvent)
    {
        if (string.Equals(lineEvent.Type, "postback", StringComparison.OrdinalIgnoreCase) &&
            string.Equals(lineEvent.Postback?.Data, "action=show-map-card", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!string.Equals(lineEvent.Type, "message", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var text = lineEvent.Message?.Text?.Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return text.Equals("แผนที่", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("ดูแผนที่", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("map", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ShouldReplyWithQueueCard(LineWebhookEvent lineEvent)
    {
        if (!string.Equals(lineEvent.Type, "message", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var text = lineEvent.Message?.Text?.Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var normalizedText = text.Replace(" ", string.Empty);

        return text.Equals("คิว", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("ดูคิว", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("คิวรถ", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("ดูคิวรถ", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("queue", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("show queue", StringComparison.OrdinalIgnoreCase) ||
               normalizedText.Contains("ดูคิว", StringComparison.OrdinalIgnoreCase) ||
               normalizedText.Contains("คิวรถ", StringComparison.OrdinalIgnoreCase);
    }

    private bool ShouldReplyWithServiceImage(LineWebhookEvent lineEvent)
    {
        if (!string.Equals(lineEvent.Type, "message", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var text = lineEvent.Message?.Text?.Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        return text.Equals("บริการ", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("ดูบริการ", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("service", StringComparison.OrdinalIgnoreCase) ||
               text.Equals("services", StringComparison.OrdinalIgnoreCase);
    }

    private string? GetServiceImageUrl()
    {
        var configuredUrl = configuration["LineServiceImage:ImageUrl"];
        if (!string.IsNullOrWhiteSpace(configuredUrl))
        {
            return configuredUrl;
        }

        return GetPublicLineAssetUrl("services.png");
    }

    private string? GetPublicLineAssetUrl(string fileName)
    {
        if (!string.Equals(Request.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase) ||
            !Request.Host.HasValue)
        {
            return null;
        }

        return $"{Request.Scheme}://{Request.Host}{Request.PathBase}/line-assets/{fileName}";
    }

    private static bool IsValidSignature(string body, string channelSecret, string signature)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(channelSecret));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        var expectedSignature = Convert.ToBase64String(hash);

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(expectedSignature),
            Encoding.UTF8.GetBytes(signature));
    }
}

public sealed record CreateRichMenuRequest(
    string? Name,
    string? ChatBarText,
    bool? Selected,
    IReadOnlyList<CreateRichMenuAreaRequest>? Areas);

public sealed record CreateRichMenuAreaRequest(
    int X,
    int Y,
    int Width,
    int Height,
    CreateRichMenuActionRequest Action);

public sealed record CreateRichMenuActionRequest(
    string Type,
    string Label,
    string? Data,
    string? Text,
    string? Uri,
    string? DisplayText);

public sealed record LineWebhookRequest(IReadOnlyList<LineWebhookEvent>? Events);

public sealed record LineWebhookEvent(
    string? Type,
    string? ReplyToken,
    LineWebhookPostback? Postback,
    LineWebhookMessage? Message);

public sealed record LineWebhookPostback(string? Data);

public sealed record LineWebhookMessage(
    string? Type,
    string? Text);
