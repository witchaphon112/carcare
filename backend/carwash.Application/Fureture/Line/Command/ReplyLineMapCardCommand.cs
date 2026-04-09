namespace carwash.Application.Fureture.Line.Command;

public sealed record ReplyLineMapCardCommand(
    string ChannelAccessToken,
    string ReplyToken,
    LineMapCardContent Content);

public sealed record LineMapCardContent(
    string Title,
    string Description,
    string AddressLabel,
    string Address,
    string PhoneLabel,
    string PhoneNumber,
    string BusinessHours,
    string CallUrl,
    string MapUrl,
    string HeroImageUrl,
    string MapPreviewImageUrl);

public sealed record ReplyLineMapCardResult(
    string ReplyToken,
    string Title);
