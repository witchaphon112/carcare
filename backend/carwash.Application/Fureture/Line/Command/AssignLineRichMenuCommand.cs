namespace carwash.Application.Fureture.Line.Command;

public sealed record AssignLineRichMenuCommand(
    string ChannelAccessToken,
    string RichMenuId,
    string? UserId = null);

public sealed record AssignLineRichMenuResult(
    string RichMenuId,
    string AssignmentType,
    string? UserId = null);
