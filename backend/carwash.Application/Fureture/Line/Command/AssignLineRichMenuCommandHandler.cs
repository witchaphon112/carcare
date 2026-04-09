using System.Net.Http.Headers;

namespace carwash.Application.Fureture.Line.Command;

public sealed class AssignLineRichMenuCommandHandler(HttpClient httpClient)
{
    private const string DefaultRichMenuEndpoint = "https://api.line.me/v2/bot/user/all/richmenu/{0}";
    private const string UserRichMenuEndpoint = "https://api.line.me/v2/bot/user/{0}/richmenu/{1}";

    public async Task<AssignLineRichMenuResult> HandleAsync(
        AssignLineRichMenuCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(command.ChannelAccessToken);
        ArgumentException.ThrowIfNullOrWhiteSpace(command.RichMenuId);

        var isDefaultAssignment = string.IsNullOrWhiteSpace(command.UserId);
        var endpoint = isDefaultAssignment
            ? string.Format(DefaultRichMenuEndpoint, command.RichMenuId)
            : string.Format(UserRichMenuEndpoint, command.UserId, command.RichMenuId);

        using var message = new HttpRequestMessage(HttpMethod.Post, endpoint);
        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", command.ChannelAccessToken);

        using var response = await httpClient.SendAsync(message, cancellationToken);
        response.EnsureSuccessStatusCode();

        return new AssignLineRichMenuResult(
            RichMenuId: command.RichMenuId,
            AssignmentType: isDefaultAssignment ? "default" : "user",
            UserId: command.UserId);
    }
}
