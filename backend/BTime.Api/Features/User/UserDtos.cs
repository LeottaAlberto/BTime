namespace BTime.Api.Features.User;

public class UserProfileRes
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public int ActiveDevicesCount { get; set; }
}

public class UpdateProfileReq
{
    public string Username { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool RemoveAvatar { get; set; } = false;
}

public class VerifyPasswordReq
{
    public string CurrentPassword { get; set; } = string.Empty;
}

public class UpdateSensitiveReq
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string? NewEmail { get; set; }
    public string? NewPassword { get; set; }
}

public class RequestSensitiveChangeReq
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string? NewEmail { get; set; }
    public string? NewPassword { get; set; }
}

public class RequestSensitiveChangeRes
{
    public string Message { get; set; } = string.Empty;
    public string MaskedEmail { get; set; } = string.Empty;
    public int ExpiresInMinutes { get; set; } = 10;
}

public class ConfirmSensitiveChangeReq
{
    public string OtpCode { get; set; } = string.Empty;
}

public class ConfirmSensitiveChangeRes
{
    public string Message { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}
