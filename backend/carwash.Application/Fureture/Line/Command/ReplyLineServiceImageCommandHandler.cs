using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace carwash.Application.Fureture.Line.Command;

public sealed class ReplyLineServiceImageCommandHandler(HttpClient httpClient)
{
    private const string ReplyEndpoint = "https://api.line.me/v2/bot/message/reply";
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public async Task<ReplyLineServiceImageResult> HandleAsync(
        ReplyLineServiceImageCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.ChannelAccessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(command.ReplyToken);
        ValidateContent(command.Content);

        var request = new ReplyLineMessageRequest(
            ReplyToken: command.ReplyToken,
            Messages:
            [
                new ImageMessage(
                    Type: "image",
                    OriginalContentUrl: command.Content.OriginalContentUrl,
                    PreviewImageUrl: command.Content.PreviewImageUrl)
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

        return new ReplyLineServiceImageResult(command.ReplyToken, command.Content.OriginalContentUrl);
    }

    private static void ValidateContent(LineServiceImageContent content)
    {
        ArgumentNullException.ThrowIfNull(content);
        ValidateAbsoluteHttpsUrl(content.OriginalContentUrl, nameof(content.OriginalContentUrl));
        ValidateAbsoluteHttpsUrl(content.PreviewImageUrl, nameof(content.PreviewImageUrl));
    }

    private static void ValidateAbsoluteHttpsUrl(string url, string parameterName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(url, parameterName);

        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            throw new ArgumentException("The image URL must be an absolute URL.", parameterName);
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            throw new ArgumentException("LINE image messages require an HTTPS image URL.", parameterName);
        }
    }

    private sealed record ReplyLineMessageRequest(
        [property: JsonPropertyName("replyToken")] string ReplyToken,
        [property: JsonPropertyName("messages")] IReadOnlyList<ImageMessage> Messages);

    private sealed record ImageMessage(
        [property: JsonPropertyName("type")] string Type,
        [property: JsonPropertyName("originalContentUrl")] string OriginalContentUrl,
        [property: JsonPropertyName("previewImageUrl")] string PreviewImageUrl);
}
