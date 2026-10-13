namespace BTime.Api.Features.Auth.RefreshToken;

public class RefreshTokenReq
{
    public string JwtToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}