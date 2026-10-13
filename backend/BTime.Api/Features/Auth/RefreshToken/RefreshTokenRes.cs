namespace BTime.Api.Features.Auth.RefreshToken;

public class RefreshTokenRes
{
    public string NewAccessToken { get; set; } = string.Empty;
    public string JwtToken { get; set; } = string.Empty;
}