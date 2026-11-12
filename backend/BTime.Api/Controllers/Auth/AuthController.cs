using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BTime.Api.Data;
using BTime.Api.Features.Auth.Login;
using BTime.Api.Features.Auth.QrLogin;
using BTime.Api.Features.Auth.RefreshToken;
using BTime.Api.Features.Auth.Register;
using BTime.Api.Features.Services;
using BTime.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BTime.Api.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext db,
    JwtService jwtService,
    IConfiguration config,
    QrLoginService qrLoginService) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly JwtService _jwtS = jwtService;
    private readonly IConfiguration _config = config;
    private readonly QrLoginService _qrService = qrLoginService;

    private int ExpiryDays =>
        int.TryParse(_config["Jwt:RefreshTokenExpiryDays"], out var d) ? d : 7;

    private int TvAppExpiryDays =>
        int.TryParse(_config["Jwt:TvAppRefreshTokenExpiryDays"], out var d) ? d : 365;

    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Cerca l'utente con il ruolo associato
        var user = await _db.Users
            .Include(u => u.RRole)
            .FirstOrDefaultAsync(u =>
                u.Username.ToLower() == (req.Username ?? "").Trim().ToLower() &&
                u.Email.ToLower() == (req.Email ?? "").Trim().ToLower());
        // Verifica utente e password
        if (user == null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(req.Password, user.Password))
            return Unauthorized(new { message = "Credenziali non valide o utente disattivato." });

        var isTvApp = IsTvAppBTimeRequest(req.IsTvAppBTime, req.DeviceInfo);
        var resolvedIp = ResolveIpAddress(req.IpAddress);
        var resolvedDevice = ResolveDeviceInfo(req.DeviceInfo, isTvApp);

        // Genera il token tramite JwtService (con durata estesa per TvAppBTime)
        var roleName = user.RRole?.Name ?? "User";
        var token = _jwtS.GenToken(user, roleName, isTvApp);

        // Aggiorna timestamp ultimo login
        user.LastLoginAt = DateTime.Now;

        await _db.SaveChangesAsync();

        // Restituisce il DTO di risposta
        var response = new LoginResponse
        {
            Token = token,
            RefreshToken = await GenerateRefrashToken(user.Id, resolvedIp, resolvedDevice, isTvApp),
            Username = user.Username,
            Email = user.Email,
            Role = roleName,
            AvatarUrl = user.AvatarUrl
        };

        return Ok(response);
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(RegisterRes), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Register([FromBody] RegisterReq req)
    {
        // Controllo se esiste un altro User con stessa mail o username
        bool userExists = await _db.Users.AnyAsync(u => u.Email == req.Email || u.Username == req.Username);
        if (userExists)
            return BadRequest(new { message = "Esiste già un utente con questo Username o Email." });

        // Si crea l'utente passando il ruole di base
        var defaultRole = await _db.Roles.FirstOrDefaultAsync(r => r.Name == "Admin")
            ?? throw new Exception("Ruolo di default non trovato nel sistema.");

        // Creazione nuovo User
        var u = new Users()
        {
            Username = req.Username,
            Email = req.Email,
            RRoleId = defaultRole.Id,
            Password = BCrypt.Net.BCrypt.HashPassword(req.Password),
            IsActive = true
        };

        // Aggiunto User al DB
        _db.Users.Add(u);
        // Salvataggio dei dati
        await _db.SaveChangesAsync();

        return Ok(new { message = "Registrazione completata con successo" });
    }

    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(RefreshTokenRes), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenReq req)
    {
        var sKey = _config["Jwt:SecretKey"] ?? throw new InvalidOperationException("Jwt:SecretKey non configurata");

        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true, // o false, in base a come l'hai configurato al login
            ValidateIssuer = true,   // o false
            ValidIssuer = "BTimeApi",
            ValidAudience = "BTimeWeb",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(sKey)),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();

        ClaimsPrincipal principal;
        try
        {
            // Questo metodo spacchetta il token. Se la firma è falsificata o non valida, lancia un'eccezione.
            principal = tokenHandler.ValidateToken(req.JwtToken, tokenValidationParameters, out SecurityToken securityToken);
        }
        catch
        {
            return Unauthorized("Token non valido");
        }

        // Estrarre l'ID
        var uIdStr = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(uIdStr) || !Guid.TryParse(uIdStr, out var userId))
            return Unauthorized("Token non valido");

        var user = await _db.Users
            .Include(u => u.RRole)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || !user.IsActive)
            return Unauthorized("Utente non trovato o disattivato");

        // Validazione Refresh Token salvato nel DB
        var activeDevice = await _db.UserDeviceActive
            .FirstOrDefaultAsync(u => u.R_UserId == user.Id && u.RefreshToken == req.RefreshToken);

        if (activeDevice == null || activeDevice.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return Unauthorized("Refresh token non valido o scaduto");

        var hasTvAppClaim = principal.Claims.Any(c =>
            c.Type == "client_app" && string.Equals(c.Value, "TvAppBTime", StringComparison.OrdinalIgnoreCase));
        var isTvApp = hasTvAppClaim || IsTvAppBTimeRequest(req.IsTvAppBTime, activeDevice.DeviceInfo);

        // Rotazione del token: genera un nuovo Refresh Token e aggiorna la scadenza (estesa per TvAppBTime)
        var newRefreshToken = Guid.NewGuid().ToString();
        activeDevice.RefreshToken = newRefreshToken;
        activeDevice.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(isTvApp ? TvAppExpiryDays : ExpiryDays);
        if (isTvApp)
        {
            activeDevice.DeviceInfo = ResolveDeviceInfo(activeDevice.DeviceInfo, true);
        }

        await _db.SaveChangesAsync();

        var res = new RefreshTokenRes()
        {
            JwtToken = _jwtS.GenToken(user, user.RRole?.Name ?? "User", isTvApp),
            RefreshToken = newRefreshToken
        };

        return Ok(res);
    }

    // ==================== QR CODE LOGIN PER TV ====================

    [HttpPost("qr/create")]
    [ProducesResponseType(typeof(QrCreateResponse), StatusCodes.Status200OK)]
    public IActionResult CreateQrSession([FromBody] QrCreateRequest? req)
    {
        var isTvApp = IsTvAppBTimeRequest(req?.IsTvAppBTime ?? false, req?.DeviceInfo);
        var resolvedIp = ResolveIpAddress(req?.IpAddress);
        var resolvedDevice = ResolveDeviceInfo(string.IsNullOrWhiteSpace(req?.DeviceInfo) ? "TV" : req.DeviceInfo, isTvApp);

        var session = _qrService.CreateSession(resolvedIp, resolvedDevice, isTvApp);
        var expiresIn = (int)Math.Max(0, (session.ExpiresAtUtc - DateTime.UtcNow).TotalSeconds);

        return Ok(new QrCreateResponse
        {
            Code = session.Code,
            ExpiresAtUtc = session.ExpiresAtUtc,
            ExpiresInSeconds = expiresIn,
            SuggestedHost = QrLoginService.GetPreferredServerHost()
        });
    }

    [HttpGet("qr/info/{code}")]
    [ProducesResponseType(typeof(QrInfoResponse), StatusCodes.Status200OK)]
    public IActionResult GetQrSessionInfo(string code)
    {
        return Ok(_qrService.GetSessionInfo(code));
    }

    [HttpGet("qr/status/{code}")]
    [ProducesResponseType(typeof(QrStatusResponse), StatusCodes.Status200OK)]
    public IActionResult GetQrSessionStatus(string code)
    {
        return Ok(_qrService.PollStatusAndConsume(code));
    }

    [Authorize]
    [HttpPost("qr/approve")]
    public async Task<IActionResult> ApproveQrSession([FromBody] QrApproveRequest req)
    {
        var pending = _qrService.GetPendingSession(req.Code);
        if (pending == null)
            return BadRequest(new { message = "Il QR Code è scaduto o è già stato utilizzato." });

        var uIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(uIdStr) || !Guid.TryParse(uIdStr, out var userId))
            return Unauthorized(new { message = "Sessione utente non valida." });

        var user = await _db.Users
            .Include(u => u.RRole)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null || !user.IsActive)
            return Unauthorized(new { message = "Utente non trovato o disattivato." });

        return await IssueTvLoginForQrSession(pending, user);
    }

    [HttpPost("qr/approve-credentials")]
    public async Task<IActionResult> ApproveQrSessionWithCredentials([FromBody] QrApproveWithCredentialsRequest req)
    {
        var pending = _qrService.GetPendingSession(req.Code);
        if (pending == null)
            return BadRequest(new { message = "Il QR Code è scaduto o è già stato utilizzato." });

        var user = await _db.Users
            .Include(u => u.RRole)
            .FirstOrDefaultAsync(u =>
                u.Username.ToLower() == (req.Username ?? "").Trim().ToLower() &&
                u.Email.ToLower() == (req.Email ?? "").Trim().ToLower());

        if (user == null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(req.Password ?? "", user.Password))
            return Unauthorized(new { message = "Credenziali non valide o utente disattivato." });

        return await IssueTvLoginForQrSession(pending, user);
    }

    private async Task<IActionResult> IssueTvLoginForQrSession(QrLoginSession pending, Users user)
    {
        var roleName = user.RRole?.Name ?? "User";
        var token = _jwtS.GenToken(user, roleName, pending.IsTvAppBTime);
        var refreshToken = await GenerateRefrashToken(
            user.Id,
            pending.TvIpAddress,
            pending.TvDeviceInfo,
            pending.IsTvAppBTime);

        user.LastLoginAt = DateTime.Now;
        await _db.SaveChangesAsync();

        var loginResponse = new LoginResponse
        {
            Token = token,
            RefreshToken = refreshToken,
            Username = user.Username,
            Email = user.Email,
            Role = roleName,
            AvatarUrl = user.AvatarUrl
        };

        if (!_qrService.TryApproveSession(pending.Code, loginResponse))
            return BadRequest(new { message = "Il QR Code è scaduto o è già stato utilizzato." });

        return Ok(new { message = "Accesso TV autorizzato con successo." });
    }

    private bool IsTvAppBTimeRequest(bool bodyFlag = false, string? deviceInfo = null)
    {
        if (bodyFlag)
            return true;

        if (!string.IsNullOrEmpty(deviceInfo) &&
            deviceInfo.Contains("TvAppBTime", StringComparison.OrdinalIgnoreCase))
            return true;

        if (Request.Headers.TryGetValue("X-Client-App", out var clientApp) &&
            clientApp.ToString().Contains("TvAppBTime", StringComparison.OrdinalIgnoreCase))
            return true;

        if (Request.Headers.TryGetValue("X-Requested-With", out var requestedWith) &&
            requestedWith.ToString().Equals("com.tvappbtime", StringComparison.OrdinalIgnoreCase))
            return true;

        var ua = Request.Headers.UserAgent.ToString();
        if (!string.IsNullOrEmpty(ua) && ua.Contains("TvAppBTime", StringComparison.OrdinalIgnoreCase))
            return true;

        return false;
    }

    private string ResolveIpAddress(string? clientIp)
    {
        var ip = !string.IsNullOrWhiteSpace(clientIp)
            ? clientIp.Trim()
            : (HttpContext.Connection.RemoteIpAddress?.ToString() ?? string.Empty);

        return ip.Length > 50 ? ip[..50] : ip;
    }

    private static string ResolveDeviceInfo(string? deviceInfo, bool isTvApp)
    {
        var info = (deviceInfo ?? string.Empty).Trim();

        if (isTvApp && !info.Contains("TvAppBTime", StringComparison.OrdinalIgnoreCase))
        {
            info = string.IsNullOrEmpty(info) ? "TV (TvAppBTime)" : $"{info} (TvAppBTime)";
        }
        else if (string.IsNullOrEmpty(info))
        {
            info = "Unknown";
        }

        return info.Length > 100 ? info[..100] : info;
    }

    private async Task<string> GenerateRefrashToken(Guid userId, string ipAddr = "", string devInfo = "", bool isTvApp = false)
    {
        var refreshToken = Guid.NewGuid().ToString();
        var expDate = DateTime.UtcNow.AddDays(isTvApp ? TvAppExpiryDays : ExpiryDays);

        if (!await UpdateRefreshTokenIntoDB(userId, refreshToken, expDate, ipAddr, devInfo))
            return string.Empty;

        return refreshToken;
    }

    private async Task<bool> UpdateRefreshTokenIntoDB(Guid userId, string newToken, DateTime eDate, string ipAddr = "", string devInfo = "")
    {
        try
        {
            var uDevAc = await _db.UserDeviceActive.FirstOrDefaultAsync(u =>
                u.R_UserId == userId &&
                u.IpAddress == ipAddr &&
                (u.DeviceInfo == devInfo || string.IsNullOrEmpty(u.DeviceInfo)));

            if (uDevAc == null)
            {
                var uDevActve = new UserDeviceActive()
                {
                    R_UserId = userId,
                    RefreshToken = newToken,
                    RefreshTokenExpiryTime = eDate,
                    IpAddress = ipAddr,
                    DeviceInfo = devInfo
                };

                _db.UserDeviceActive.Add(uDevActve);
            }
            else
            {
                uDevAc.RefreshToken = newToken;
                uDevAc.RefreshTokenExpiryTime = eDate;
                uDevAc.DeviceInfo = devInfo;
            }

            await _db.SaveChangesAsync();
        } catch(DbUpdateException ex)
        {
            Console.WriteLine($"Errore durante il salvataggio: {ex.InnerException?.Message ?? ex.Message}");
            return false;
        }

        return true;
    }
}
