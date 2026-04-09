using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace carwash.Application.Fureture.Line.Command;

public sealed class CreateLineRichMenuCommandHandler(HttpClient httpClient)
{
    private const string RichMenuEndpoint = "https://api.line.me/v2/bot/richmenu";

    public async Task<CreateLineRichMenuResult> HandleAsync(
        CreateLineRichMenuCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.ChannelAccessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(command.Name);
        ArgumentException.ThrowIfNullOrWhiteSpace(command.ChatBarText);

        var request = new CreateLineRichMenuRequest(
            Size: new LineRichMenuSize(Width: 800, Height: 540),
            Selected: command.Selected,
            Name: command.Name,
            ChatBarText: command.ChatBarText,
            Areas: command.GetAreas().Select(MapArea).ToArray());

        using var message = new HttpRequestMessage(HttpMethod.Post, RichMenuEndpoint)
        {
            Content = JsonContent.Create(request)
        };

        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", command.ChannelAccessToken);

        using var response = await httpClient.SendAsync(message, cancellationToken);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<CreateLineRichMenuResponse>(cancellationToken);
        if (string.IsNullOrWhiteSpace(payload?.RichMenuId))
        {
            throw new InvalidOperationException("LINE API did not return a rich menu id.");
        }

        return new CreateLineRichMenuResult(
            RichMenuId: payload.RichMenuId,
            Name: command.Name,
            ChatBarText: command.ChatBarText);
    }

    private static LineRichMenuArea MapArea(LineRichMenuAreaCommand area)
    {
        ValidateBounds(area);
        ValidateAction(area.Action);

        return new LineRichMenuArea(
            Bounds: new LineRichMenuBounds(area.X, area.Y, area.Width, area.Height),
            Action: new LineRichMenuAction(
                Type: area.Action.Type,
                Label: area.Action.Label,
                Data: area.Action.Data,
                Text: area.Action.Text,
                Uri: area.Action.Uri,
                DisplayText: area.Action.DisplayText));
    }

    private static void ValidateBounds(LineRichMenuAreaCommand area)
    {
        if (area.Width <= 0 || area.Height <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(area), "Area width and height must be greater than zero.");
        }

        if (area.X < 0 || area.Y < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(area), "Area position cannot be negative.");
        }

        if (area.X + area.Width > 800 || area.Y + area.Height > 540)
        {
            throw new ArgumentOutOfRangeException(nameof(area), "Area is outside the 800x540 rich menu canvas.");
        }
    }

    private static void ValidateAction(LineRichMenuActionCommand action)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(action.Type);
        ArgumentException.ThrowIfNullOrWhiteSpace(action.Label);

        switch (action.Type.ToLowerInvariant())
        {
            case "postback":
                ArgumentException.ThrowIfNullOrWhiteSpace(action.Data);
                break;
            case "message":
                ArgumentException.ThrowIfNullOrWhiteSpace(action.Text);
                break;
            case "uri":
                ArgumentException.ThrowIfNullOrWhiteSpace(action.Uri);
                break;
            default:
                throw new NotSupportedException($"Unsupported LINE rich menu action type: {action.Type}");
        }
    }

    private sealed record CreateLineRichMenuRequest(
        [property: JsonPropertyName("size")] LineRichMenuSize Size,
        [property: JsonPropertyName("selected")] bool Selected,
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("chatBarText")] string ChatBarText,
        [property: JsonPropertyName("areas")] IReadOnlyList<LineRichMenuArea> Areas);

    private sealed record LineRichMenuSize(
        [property: JsonPropertyName("width")] int Width,
        [property: JsonPropertyName("height")] int Height);

    private sealed record LineRichMenuArea(
        [property: JsonPropertyName("bounds")] LineRichMenuBounds Bounds,
        [property: JsonPropertyName("action")] LineRichMenuAction Action);

    private sealed record LineRichMenuBounds(
        [property: JsonPropertyName("x")] int X,
        [property: JsonPropertyName("y")] int Y,
        [property: JsonPropertyName("width")] int Width,
        [property: JsonPropertyName("height")] int Height);

    private sealed record LineRichMenuAction(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("label")] string Label,
        [property: JsonPropertyName("data")] string? Data,
        [property: JsonPropertyName("text")] string? Text,
        [property: JsonPropertyName("uri")] string? Uri,
        [property: JsonPropertyName("displayText")] string? DisplayText);

    private sealed record CreateLineRichMenuResponse(
        [property: JsonPropertyName("richMenuId")] string RichMenuId);
}
