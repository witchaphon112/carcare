namespace carwash.Application.Fureture.Line.Command;

public sealed record CreateLineRichMenuCommand(
    string ChannelAccessToken,
    string Name = "carcare-main-richmenu",
    string ChatBarText = "เมนู CarCare",
    bool Selected = true,
    IReadOnlyList<LineRichMenuAreaCommand>? Areas = null)
{
    public IReadOnlyList<LineRichMenuAreaCommand> GetAreas()
    {
        return Areas is { Count: > 0 } ? Areas : CreateDefaultAreas();
    }

    public static IReadOnlyList<LineRichMenuAreaCommand> CreateDefaultAreas()
    {
        return
        [
            new LineRichMenuAreaCommand(
                X: 0,
                Y: 270,
                Width: 266,
                Height: 270,
                Action: new LineRichMenuActionCommand(
                    Type: "message",
                    Label: "บริการของเรา",
                    Text: "บริการ")),
            new LineRichMenuAreaCommand(
                X: 266,
                Y: 270,
                Width: 267,
                Height: 270,
                Action: new LineRichMenuActionCommand(
                    Type: "message",
                    Label: "ดูคิวรถ",
                    Text: "ดูคิวรถ")),
            new LineRichMenuAreaCommand(
                X: 533,
                Y: 270,
                Width: 267,
                Height: 270,
                Action: new LineRichMenuActionCommand(
                    Type: "message",
                    Label: "แผนที่",
                    Text: "แผนที่"))
        ];
    }
}

public sealed record LineRichMenuAreaCommand(
    int X,
    int Y,
    int Width,
    int Height,
    LineRichMenuActionCommand Action);

public sealed record LineRichMenuActionCommand(
    string Type,
    string Label,
    string? Data = null,
    string? Text = null,
    string? Uri = null,
    string? DisplayText = null);

public sealed record CreateLineRichMenuResult(
    string RichMenuId,
    string Name,
    string ChatBarText);
