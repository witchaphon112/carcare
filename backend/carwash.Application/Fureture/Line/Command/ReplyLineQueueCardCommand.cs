namespace carwash.Application.Fureture.Line.Command;

public sealed record ReplyLineQueueCardCommand(
    string ChannelAccessToken,
    string ReplyToken,
    LineQueueCardContent Content);

public sealed record LineQueueCardContent(
    string BadgeText,
    string Title,
    string Subtitle,
    string QueueNumberLabel,
    string QueueNumber,
    string QueueCountAheadLabel,
    string QueueCountAhead,
    string EstimatedWaitLabel,
    string EstimatedWaitMinutes,
    string StatusLabel,
    string StatusValue,
    string VehicleLabel,
    string VehicleName,
    string ServiceLabel,
    string ServiceName,
    string QueueUrl,
    string CallUrl,
    string HeroImageUrl);

public sealed record ReplyLineQueueCardResult(
    string ReplyToken,
    string Title);
