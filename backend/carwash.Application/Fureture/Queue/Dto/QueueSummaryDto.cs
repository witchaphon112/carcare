namespace carwash.Application.Fureture.Queue.Dto;

public sealed record QueueSummaryDto(
    Guid Id,
    string QueueId,
    string QueueCar,
    int WaitTime,
    decimal TotalAmount,
    string ShopStatus,
    int QueueCount);
