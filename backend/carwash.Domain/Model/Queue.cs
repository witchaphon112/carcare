namespace carwash.Domain.Model;

public sealed class Queue
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string QueueId { get; set; } = string.Empty;

    public string QueueCar { get; set; } = string.Empty;

    public int WaitTime { get; set; }

    public decimal TotalAmount { get; set; }

    public ShopStatus ShopStatus { get; set; } = ShopStatus.Open;

    public QueueStatus QueueStatus { get; set; } = QueueStatus.Waiting;
}

public enum ShopStatus
{
    Open = 1,
    Busy = 2,
    Closed = 3
}

public enum QueueStatus
{
    Waiting = 1,
    InProgress = 2,
    Completed = 3,
    Cancelled = 4
}
