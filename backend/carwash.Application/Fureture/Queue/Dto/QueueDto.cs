namespace carwash.Application.Fureture.Queue.Dto;

public sealed record QueueDto(
    Guid Id,
    string QueueId,
    string QueueCar,
    int WaitTime,
    decimal TotalAmount,
    string ShopStatus,
    string QueueStatus);
