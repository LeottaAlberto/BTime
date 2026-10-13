using BTime.Api.Features.Auth.Login;

namespace BTime.Api.Features.Auth.Register;

public class RegisterRes
{
    public required LoginResponse Res { get; set; }
    public string Message { get; set; } = string.Empty;
}

