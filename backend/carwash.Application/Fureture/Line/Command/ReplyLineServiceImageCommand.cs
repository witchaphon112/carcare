namespace carwash.Application.Fureture.Line.Command;

public sealed record ReplyLineServiceImageCommand(
    string ChannelAccessToken,
    string ReplyToken,
    LineServiceImageContent Content);

public sealed record LineServiceImageContent(
    string OriginalContentUrl,
    string PreviewImageUrl);

public sealed record ReplyLineServiceImageResult(
    string ReplyToken,
    string OriginalContentUrl);
