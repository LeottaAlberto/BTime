namespace BTime.Api.Features.Auth.Login;

public class LoginRequest {
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public string DeviceInfo { get; set; } = string.Empty;
}