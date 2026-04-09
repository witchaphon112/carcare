using System.Net.Http.Headers;

namespace carwash.Application.Fureture.Line.Command;

public sealed class UploadLineRichMenuImageCommandHandler(HttpClient httpClient)
{
    private const string RichMenuContentEndpoint = "https://api-data.line.me/v2/bot/richmenu/{0}/content";

    public async Task<UploadLineRichMenuImageResult> HandleAsync(
        UploadLineRichMenuImageCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.ChannelAccessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(command.RichMenuId);

        if (command.Content.Length == 0)
        {
            throw new ArgumentException("Image content cannot be empty.", nameof(command));
        }

        if (!IsSupportedContentType(command.ContentType))
        {
            throw new NotSupportedException("LINE rich menu image supports only image/png or image/jpeg.");
        }

        var endpoint = string.Format(RichMenuContentEndpoint, command.RichMenuId);

        using var message = new HttpRequestMessage(HttpMethod.Post, endpoint);
        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", command.ChannelAccessToken);

        using var content = new ByteArrayContent(command.Content);
        content.Headers.ContentType = new MediaTypeHeaderValue(command.ContentType);
        message.Content = content;

        using var response = await httpClient.SendAsync(message, cancellationToken);
        response.EnsureSuccessStatusCode();

        return new UploadLineRichMenuImageResult(
            RichMenuId: command.RichMenuId,
            ContentType: command.ContentType,
            ContentLength: command.Content.Length);
    }

    private static bool IsSupportedContentType(string contentType)
    {
        return string.Equals(contentType, "image/png", StringComparison.OrdinalIgnoreCase)
            || string.Equals(contentType, "image/jpeg", StringComparison.OrdinalIgnoreCase);
    }
}
