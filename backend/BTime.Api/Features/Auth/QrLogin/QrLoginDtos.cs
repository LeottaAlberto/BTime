using BTime.Api.Features.Auth.Login;

namespace BTime.Api.Features.Auth.QrLogin;

public class QrCreateRequest
{
    public string IpAddress { get; set; } = string.Empty;
    public string DeviceInfo { get; set; } = string.Empty;
    public bool IsTvAppBTime { get; set; } = false;
}

public class QrCreateResponse
{
    public string Code { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public int ExpiresInSeconds { get; set; }
    public string? SuggestedHost { get; set; }
}

public class QrInfoResponse
{
    public bool Valid { get; set; }
    public string Status { get; set; } = "Expired";
    public string DeviceInfo { get; set; } = string.Empty;
    public bool IsTvAppBTime { get; set; }
    public int RemainingSeconds { get; set; }
}

public class QrStatusResponse
{
    public string Status { get; set; } = "Expired";
    public int RemainingSeconds { get; set; }
    public LoginResponse? LoginResponse { get; set; }
}

public class QrApproveRequest
{
    public string Code { get; set; } = string.Empty;
}

public class QrApproveWithCredentialsRequest
{
    public string Code { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

