namespace carwash.Application.Fureture.Line.Command;

public sealed record UploadLineRichMenuImageCommand(
    string ChannelAccessToken,
    string RichMenuId,
    byte[] Content,
    string ContentType = "image/png");

public sealed record UploadLineRichMenuImageResult(
    string RichMenuId,
    string ContentType,
    int ContentLength);
