using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace carwash.Application.Fureture.Line.Command;

public sealed class ReplyLineQueueCardCommandHandler(HttpClient httpClient)
{
    private const string ReplyEndpoint = "https://api.line.me/v2/bot/message/reply";
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<ReplyLineQueueCardResult> HandleAsync(
        ReplyLineQueueCardCommand command,
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
                    AltText: $"{command.Content.Title} สถานะคิวล่าสุด",
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

        return new ReplyLineQueueCardResult(command.ReplyToken, command.Content.Title);
    }

    private static FlexBubble CreateBubble(LineQueueCardContent content)
    {
        return new FlexBubble(
            Type: "bubble",
            Size: "kilo",
            Body: new FlexBox(
                Type: "box",
                Layout: "vertical",
                PaddingAll: "20px",
                BackgroundColor: "#FFFFFF",
                Spacing: "lg",
                Contents:
                [
                    CreateHeader(content),
                    CreateQueueCountCard(content),
                    CreateWaitTimeCard(content),
                    CreateStatusCard(content),
                    CreateCallButton(content)
                ]));
    }

    private static FlexBox CreateHeader(LineQueueCardContent content)
    {
        return new FlexBox(
            Type: "box",
            Layout: "vertical",
            Spacing: "sm",
            Contents:
            [
                new FlexText("text", content.Title, Size: "lg", Weight: "bold", Color: "#0F172A"),
                new FlexText(
                    "text",
                    string.IsNullOrWhiteSpace(content.Subtitle) ? "อัปเดตเวลาคิวล่าสุด" : content.Subtitle,
                    Size: "sm",
                    Color: "#64748B",
                    Wrap: true)
            ]);
    }

    private static FlexBox CreateQueueCountCard(LineQueueCardContent content)
    {
        return new FlexBox(
            Type: "box",
            Layout: "vertical",
            BackgroundColor: "#1D4ED8",
            CornerRadius: "24px",
            PaddingAll: "22px",
            Contents:
            [
                new FlexText("text", content.QueueCountAheadLabel, Size: "sm", Weight: "bold", Color: "#DBEAFE"),
                new FlexBox(
                    Type: "box",
                    Layout: "baseline",
                    Margin: "md",
                    AlignItems: "flex-end",
                    Contents:
                    [
                        new FlexText("text", ExtractQueueCountNumber(content.QueueCountAhead), Size: "5xl", Weight: "bold", Color: "#FFFFFF"),
                        new FlexText("text", "คัน", Size: "md", Weight: "bold", Color: "#DBEAFE", Margin: "md")
                    ]),
                new FlexText("text", "จำนวนคิวที่รออยู่ก่อนคุณ", Size: "xs", Color: "#BFDBFE", Margin: "md", Wrap: true)
            ]);
    }

    private static FlexBox CreateWaitTimeCard(LineQueueCardContent content)
    {
        return new FlexBox(
            Type: "box",
            Layout: "vertical",
            BackgroundColor: "#EFF6FF",
            CornerRadius: "18px",
            PaddingAll: "16px",
            Spacing: "md",
            Contents:
            [
                CreateDetailRow(content.EstimatedWaitLabel, $"{content.EstimatedWaitMinutes} นาที"),
                new FlexText("text", "คำนวณจาก 1 คันประมาณ 50 นาที", Size: "xs", Color: "#64748B", Wrap: true)
            ]);
    }

    private static FlexBox CreateStatusCard(LineQueueCardContent content)
    {
        var isOpenStatus = IsOpenStatus(content.StatusValue);
        var backgroundColor = isOpenStatus ? "#DCFCE7" : "#F8FAFC";
        var labelColor = isOpenStatus ? "#166534" : "#64748B";
        var valueColor = isOpenStatus ? "#166534" : "#0F172A";

        return new FlexBox(
            Type: "box",
            Layout: "vertical",
            BackgroundColor: backgroundColor,
            CornerRadius: "18px",
            PaddingAll: "16px",
            Contents:
            [
                CreateDetailRow(content.StatusLabel, content.StatusValue, labelColor, valueColor)
            ]);
    }

    private static FlexBox CreateCallButton(LineQueueCardContent content)
    {
        return new FlexBox(
            Type: "box",
            Layout: "vertical",
            BackgroundColor: "#0F172A",
            CornerRadius: "18px",
            PaddingTop: "16px",
            PaddingBottom: "16px",
            Action: new FlexAction("uri", Uri: content.CallUrl),
            Contents:
            [
                new FlexText("text", "โทรรับรถไปล้าง", Size: "md", Weight: "bold", Color: "#FFFFFF", Align: "center"),
                new FlexText("text", "แตะเพื่อโทรหาร้านได้ทันที", Size: "xs", Color: "#CBD5E1", Align: "center", Margin: "sm")
            ]);
    }

    private static FlexBox CreateDetailRow(
        string label,
        string value,
        string labelColor = "#64748B",
        string valueColor = "#0F172A")
    {
        return new FlexBox(
            Type: "box",
            Layout: "horizontal",
            JustifyContent: "space-between",
            AlignItems: "center",
            Contents:
            [
                new FlexText("text", label, Size: "sm", Color: labelColor),
                new FlexText("text", value, Size: "sm", Weight: "bold", Color: valueColor, Wrap: true, Align: "end")
            ]);
    }

    private static void ValidateContent(LineQueueCardContent content)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(content.Title);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.QueueCountAhead);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.EstimatedWaitMinutes);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.StatusValue);
        ArgumentException.ThrowIfNullOrWhiteSpace(content.CallUrl);
    }

    private static string ExtractQueueCountNumber(string queueCountAhead)
    {
        var digits = new string(queueCountAhead.Where(char.IsDigit).ToArray());
        return string.IsNullOrWhiteSpace(digits) ? queueCountAhead : digits;
    }

    private static bool IsOpenStatus(string statusValue)
    {
        if (string.IsNullOrWhiteSpace(statusValue))
        {
            return false;
        }

        return statusValue.Contains("กำลังให้บริการ", StringComparison.OrdinalIgnoreCase) ||
               statusValue.Contains("เปิด", StringComparison.OrdinalIgnoreCase) ||
               statusValue.Contains("open", StringComparison.OrdinalIgnoreCase);
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
        [property: JsonPropertyName("justifyContent")] string? JustifyContent = null,
        [property: JsonPropertyName("alignItems")] string? AlignItems = null,
        [property: JsonPropertyName("spacing")] string? Spacing = null,
        [property: JsonPropertyName("flex")] int? Flex = null,
        [property: JsonPropertyName("margin")] string? Margin = null,
        [property: JsonPropertyName("width")] string? Width = null,
        [property: JsonPropertyName("height")] string? Height = null,
        [property: JsonPropertyName("action")] FlexAction? Action = null);

    private sealed record FlexText(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("text")] string Text,
        [property: JsonPropertyName("size")] string? Size = null,
        [property: JsonPropertyName("weight")] string? Weight = null,
        [property: JsonPropertyName("color")] string? Color = null,
        [property: JsonPropertyName("wrap")] bool? Wrap = null,
        [property: JsonPropertyName("align")] string? Align = null,
        [property: JsonPropertyName("margin")] string? Margin = null);

    private sealed record FlexAction(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("uri")] string? Uri = null);
}
