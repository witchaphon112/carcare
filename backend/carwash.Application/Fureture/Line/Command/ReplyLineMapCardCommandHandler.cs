using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace carwash.Application.Fureture.Line.Command;

public sealed class ReplyLineMapCardCommandHandler(HttpClient httpClient)
{
    private const string ReplyEndpoint = "https://api.line.me/v2/bot/message/reply";
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<ReplyLineMapCardResult> HandleAsync(
        ReplyLineMapCardCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.ChannelAccessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(command.ReplyToken);
        ValidateContent(command.Content);

        var request = new ReplyLineMessageRequest(
            ReplyToken: command.ReplyToken,
            Messages:
            [
                new FlexMessage(
                    Type: "flex",
                    AltText: $"{command.Content.Title} ติดต่อและแผนที่",
                    Contents: CreateBubble(command.Content))
            ]);

        using var message = new HttpRequestMessage(HttpMethod.Post, ReplyEndpoint)
        {
            Content = JsonContent.Create(request, options: SerializerOptions)
        };

        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", command.ChannelAccessToken);

        using var response = await httpClient.SendAsync(message, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"LINE reply API returned {(int)response.StatusCode} {response.ReasonPhrase}. Response: {responseBody}");
        }

        return new ReplyLineMapCardResult(command.ReplyToken, command.Content.Title);
    }

    private static FlexBubble CreateBubble(LineMapCardContent content)
    {
        return new FlexBubble(
            Type: "bubble",
            Size: "kilo",
            Hero: new FlexBox(
                Type: "box",
                Layout: "vertical",
                PaddingAll: "0px",
                Contents:
                [
                    new FlexImage(
                        Type: "image",
                        Url: content.HeroImageUrl,
                        Size: "full",
                        AspectRatio: "4:3",
                        AspectMode: "cover",
                        Gravity: "center"),
                    new FlexBox(
                        Type: "box",
                        Layout: "vertical",
                        Position: "absolute",
                        OffsetTop: "0px",
                        OffsetBottom: "0px",
                        OffsetStart: "0px",
                        OffsetEnd: "0px",
                        BackgroundColor: "#0B1220CC",
                        Contents: []),
                    new FlexBox(
                        Type: "box",
                        Layout: "vertical",
                        Position: "absolute",
                        OffsetBottom: "18px",
                        OffsetStart: "18px",
                        OffsetEnd: "18px",
                        PaddingAll: "0px",
                        Contents:
                        [
                            new FlexText(
                                Type: "text",
                                Text: content.Title,
                                Weight: "bold",
                                Size: "xl",
                                Color: "#FFFFFF",
                                Wrap: true,
                                Margin: "xs"),
                            new FlexText(
                                Type: "text",
                                Text: content.Description,
                                Size: "xs",
                                Color: "#D1D5DB",
                                Wrap: true,
                                Margin: "sm")
                        ])
                ]),
            Body: new FlexBox(
                Type: "box",
                Layout: "vertical",
                PaddingTop: "18px",
                PaddingBottom: "18px",
                PaddingStart: "18px",
                PaddingEnd: "18px",
                BackgroundColor: "#FFFFFF",
                Spacing: "md",
                Contents:
                [
                    new FlexText("text", "ข้อมูลร้าน", Weight: "bold", Size: "lg", Color: "#0F172A"),
                    new FlexBox(
                        Type: "box",
                        Layout: "horizontal",
                        BackgroundColor: "#EFF6FF",
                        CornerRadius: "16px",
                        PaddingAll: "12px",
                        AlignItems: "center",
                        Spacing: "sm",
                        Contents:
                        [
                            new FlexText("text", "เวลา", Size: "xs", Weight: "bold", Color: "#0369A1"),
                            new FlexText("text", content.BusinessHours, Size: "sm", Weight: "bold", Color: "#0F172A", Wrap: true)
                        ]),
                    CreateInfoBlock("#DBEAFE", "#2563EB", "⌖", content.AddressLabel, content.Address),
                    CreateInfoBlock("#DCFCE7", "#16A34A", "✆", content.PhoneLabel, content.PhoneNumber),
                    new FlexBox(
                        Type: "box",
                        Layout: "horizontal",
                        Spacing: "sm",
                        Contents:
                        [
                            CreateButton("#111827", "#FFFFFF", "โทร", content.CallUrl, "✆"),
                            CreateButton("#2563EB", "#FFFFFF", "แผนที่", content.MapUrl, "⌖")
                        ]),
                    CreatePoweredByRow(content)
                ]));
    }

    private static FlexBox CreateInfoBlock(
        string iconBackgroundColor,
        string iconTextColor,
        string icon,
        string label,
        string primaryText,
        string? secondaryText = null)
    {
        var textContents = new List<object>
        {
            new FlexText("text", label, Size: "xs", Weight: "bold", Color: "#9CA3AF"),
            new FlexText("text", primaryText, Size: "lg", Weight: "bold", Color: "#37404A", Wrap: true, LineSpacing: "3px", Margin: "xs")
        };

        if (!string.IsNullOrWhiteSpace(secondaryText))
        {
            textContents.Add(new FlexText("text", secondaryText, Size: "sm", Color: "#9CA3AF", Wrap: true, Margin: "xs"));
        }

        return new FlexBox(
            Type: "box",
            Layout: "horizontal",
            Spacing: "sm",
            Contents:
            [
                new FlexBox(
                    Type: "box",
                    Layout: "vertical",
                    Width: "36px",
                    Height: "36px",
                    CornerRadius: "18px",
                    BackgroundColor: iconBackgroundColor,
                    JustifyContent: "center",
                    AlignItems: "center",
                    Contents:
                    [
                        new FlexText("text", icon, Color: iconTextColor, Size: "sm", Align: "center")
                    ]),
                new FlexBox(
                    Type: "box",
                    Layout: "vertical",
                    Flex: 1,
                    Contents: textContents)
            ]);
    }

    private static FlexBox CreateButton(
        string backgroundColor,
        string textColor,
        string label,
        string uri,
        string icon)
    {
        return new FlexBox(
            Type: "box",
            Layout: "vertical",
            Flex: 1,
            BackgroundColor: backgroundColor,
            CornerRadius: "14px",
            PaddingTop: "12px",
            PaddingBottom: "12px",
            PaddingStart: "12px",
            PaddingEnd: "12px",
            Action: new FlexAction("uri", Uri: uri),
            Contents:
            [
                new FlexText(
                    Type: "text",
                    Text: $"{icon}  {label}",
                    Weight: "bold",
                    Size: "sm",
                    Color: textColor,
                    Align: "center")
            ]);
    }

    private static FlexBox CreatePoweredByRow(LineMapCardContent content)
    {
        return new FlexBox(
            Type: "box",
            Layout: "vertical",
            BackgroundColor: "#F8FAFC",
            CornerRadius: "14px",
            PaddingAll: "12px",
            Contents:
            [
                new FlexText(
                    "text",
                    "พร้อมให้บริการ",
                    Size: "xs",
                    Weight: "bold",
                    Color: "#475569"),
                new FlexText(
                    "text",
                    content.Title,
                    Size: "md",
                    Weight: "bold",
                    Color: "#0F172A",
                    Margin: "xs"),
                new FlexText(
                    "text",
                    "กดปุ่มด้านบนเพื่อโทรหรือเปิดนำทางได้ทันที",
                    Size: "xs",
                    Color: "#475569",
                    Wrap: true,
                    Margin: "xs")
            ]);
    }

    private static void ValidateContent(LineMapCardContent content)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content.Title);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.Description);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.Address);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.PhoneNumber);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.CallUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.MapUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.HeroImageUrl);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.MapPreviewImageUrl);
    }

    private sealed record ReplyLineMessageRequest(
        [property: JsonPropertyName("replyToken")] string ReplyToken,
        [property: JsonPropertyName("messages")] IReadOnlyList<FlexMessage> Messages);

    private sealed record FlexMessage(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("altText")] string AltText,
        [property: JsonPropertyName("contents")] FlexBubble Contents);

    private sealed record FlexBubble(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("size")] string Size,
        [property: JsonPropertyName("hero")] FlexBox Hero,
        [property: JsonPropertyName("body")] FlexBox Body);

    private sealed record FlexBox(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("layout")] string Layout,
        [property: JsonPropertyName("contents")] IReadOnlyList<object> Contents,
        [property: JsonPropertyName("paddingAll")] string? PaddingAll = null,
        [property: JsonPropertyName("paddingStart")] string? PaddingStart = null,
        [property: JsonPropertyName("paddingEnd")] string? PaddingEnd = null,
        [property: JsonPropertyName("paddingTop")] string? PaddingTop = null,
        [property: JsonPropertyName("paddingBottom")] string? PaddingBottom = null,
        [property: JsonPropertyName("backgroundColor")] string? BackgroundColor = null,
        [property: JsonPropertyName("cornerRadius")] string? CornerRadius = null,
        [property: JsonPropertyName("position")] string? Position = null,
        [property: JsonPropertyName("offsetTop")] string? OffsetTop = null,
        [property: JsonPropertyName("offsetBottom")] string? OffsetBottom = null,
        [property: JsonPropertyName("offsetStart")] string? OffsetStart = null,
        [property: JsonPropertyName("offsetEnd")] string? OffsetEnd = null,
        [property: JsonPropertyName("width")] string? Width = null,
        [property: JsonPropertyName("height")] string? Height = null,
        [property: JsonPropertyName("justifyContent")] string? JustifyContent = null,
        [property: JsonPropertyName("alignItems")] string? AlignItems = null,
        [property: JsonPropertyName("spacing")] string? Spacing = null,
        [property: JsonPropertyName("flex")] int? Flex = null,
        [property: JsonPropertyName("margin")] string? Margin = null,
        [property: JsonPropertyName("action")] FlexAction? Action = null);

    private sealed record FlexText(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("text")] string Text,
        [property: JsonPropertyName("size")] string? Size = null,
        [property: JsonPropertyName("weight")] string? Weight = null,
        [property: JsonPropertyName("color")] string? Color = null,
        [property: JsonPropertyName("wrap")] bool? Wrap = null,
        [property: JsonPropertyName("align")] string? Align = null,
        [property: JsonPropertyName("lineSpacing")] string? LineSpacing = null,
        [property: JsonPropertyName("margin")] string? Margin = null);

    private sealed record FlexImage(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("url")] string Url,
        [property: JsonPropertyName("size")] string? Size = null,
        [property: JsonPropertyName("aspectRatio")] string? AspectRatio = null,
        [property: JsonPropertyName("aspectMode")] string? AspectMode = null,
        [property: JsonPropertyName("gravity")] string? Gravity = null);

    private sealed record FlexAction(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("uri")] string? Uri = null);
}
