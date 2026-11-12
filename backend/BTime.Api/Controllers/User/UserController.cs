using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using BTime.Api.Data;
using BTime.Api.Features.Services;
using BTime.Api.Features.User;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTime.Api.Controllers.User;

[ApiController]
[Route("api/user")]
[Authorize]
public class UserController(
    AppDbContext db,
    IWebHostEnvironment env,
    JwtService jwtService,
    EmailService emailService,
    SensitiveChangeOtpService otpService) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly IWebHostEnvironment _env = env;
    private readonly JwtService _jwtService = jwtService;
    private readonly EmailService _emailService = emailService;
    private readonly SensitiveChangeOtpService _otpService = otpService;

    private Guid? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(claim, out var userId) ? userId : null;
    }

    private bool IsTvAppSession() =>
        string.Equals(User.FindFirstValue("client_app"), "TvAppBTime", StringComparison.OrdinalIgnoreCase);

    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileRes>> GetProfile()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var user = await _db.Users
            .AsNoTracking()
            .Include(u => u.RRole)
            .Include(u => u.ActiveDevices)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null) return NotFound(new { message = "Utente non trovato." });

        return Ok(new UserProfileRes
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            Role = user.RRole?.Name ?? "User",
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt,
            ActiveDevicesCount = user.ActiveDevices.Count
        });
    }

    /// <summary>
    /// Aggiorna solo le informazioni non sensibili (Username e Avatar opzionale)
    /// </summary>
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileReq req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var username = req.Username?.Trim() ?? string.Empty;
        if (username.Length < 3 || username.Length > 50)
            return BadRequest(new { message = "Lo username deve contenere tra 3 e 50 caratteri." });

        var user = await _db.Users
            .Include(u => u.RRole)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null) return NotFound(new { message = "Utente non trovato." });

        var usernameTaken = await _db.Users
            .AnyAsync(u => u.Id != user.Id && u.Username.ToLower() == username.ToLower());

        if (usernameTaken)
            return Conflict(new { message = "Questo username è già in uso da un altro account." });

        user.Username = username;

        if (req.RemoveAvatar)
        {
            TryDeleteLocalAvatar(user.AvatarUrl);
            user.AvatarUrl = null;
        }
        else if (!string.IsNullOrWhiteSpace(req.AvatarUrl))
        {
            user.AvatarUrl = req.AvatarUrl.Trim();
        }

        await _db.SaveChangesAsync();

        var roleName = user.RRole?.Name ?? "User";
        var newToken = _jwtService.GenToken(user, roleName, IsTvAppSession());

        return Ok(new
        {
            message = "Profilo aggiornato con successo.",
            username = user.Username,
            avatarUrl = user.AvatarUrl,
            token = newToken
        });
    }

    /// <summary>
    /// Carica una nuova immagine profilo (avatar)
    /// </summary>
    [HttpPost("upload-avatar")]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Nessuna immagine selezionata." });

        if (file.Length > 5L * 1024 * 1024)
            return BadRequest(new { message = "L'immagine non può superare i 5 MB." });

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(ext))
            return BadRequest(new { message = "Formato immagine non supportato. Usa JPG, PNG o WEBP." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user == null) return NotFound(new { message = "Utente non trovato." });

        var avatarsDir = Path.Combine(_env.ContentRootPath, "uploads", "avatars");
        if (!Directory.Exists(avatarsDir))
            Directory.CreateDirectory(avatarsDir);

        var fileName = $"{user.Id}_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(avatarsDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        TryDeleteLocalAvatar(user.AvatarUrl);

        user.AvatarUrl = $"/uploads/avatars/{fileName}";
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message = "Immagine profilo aggiornata.",
            avatarUrl = user.AvatarUrl
        });
    }

    /// <summary>
    /// Verifica la password attuale per sbloccare la sezione dati sensibili nella UI.
    /// Invia un'email di avviso di sicurezza che notifica l'accesso alle impostazioni riservate.
    /// </summary>
    [HttpPost("verify-password")]
    public async Task<IActionResult> VerifyPassword([FromBody] VerifyPasswordReq req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.CurrentPassword))
            return BadRequest(new { message = "Inserisci la password attuale." });

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user == null) return NotFound(new { message = "Utente non trovato." });

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.Password))
            return BadRequest(new { message = "La password attuale non è corretta." });

        // Invia email di avviso di sicurezza in background
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userEmail = user.Email;
        var username = user.Username;
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendSecurityAlertEmailAsync(userEmail, username, clientIp);
            }
            catch
            {
                // Non blocca il client in caso di temporaneo problema di rete mail
            }
        });

        return Ok(new
        {
            verified = true,
            message = "Password verificata con successo. È stata inviata un'email di avviso di sicurezza."
        });
    }

    /// <summary>
    /// Avvia la procedura per modificare dati sensibili (Email / Password).
    /// Genera un codice OTP numerico e invia un'email di verifica all'indirizzo dell'account.
    /// </summary>
    [HttpPost("sensitive/request")]
    public async Task<IActionResult> RequestSensitiveChange([FromBody] RequestSensitiveChangeReq req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.CurrentPassword))
            return BadRequest(new { message = "La password attuale è obbligatoria per richiedere modifiche di sicurezza." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user == null) return NotFound(new { message = "Utente non trovato." });

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.Password))
            return BadRequest(new { message = "La password attuale non è corretta." });

        var hasEmailChange = !string.IsNullOrWhiteSpace(req.NewEmail) &&
                             !string.Equals(req.NewEmail.Trim(), user.Email, StringComparison.OrdinalIgnoreCase);
        var hasPasswordChange = !string.IsNullOrWhiteSpace(req.NewPassword);

        if (!hasEmailChange && !hasPasswordChange)
            return BadRequest(new { message = "Nessuna modifica sensibile da salvare." });

        string? validatedNewEmail = null;
        if (hasEmailChange)
        {
            var newEmail = req.NewEmail!.Trim();
            if (!new EmailAddressAttribute().IsValid(newEmail))
                return BadRequest(new { message = "Inserisci un indirizzo email valido." });

            var emailTaken = await _db.Users
                .AnyAsync(u => u.Id != user.Id && u.Email.ToLower() == newEmail.ToLower());

            if (emailTaken)
                return Conflict(new { message = "Questa email è già associata a un altro account." });

            validatedNewEmail = newEmail;
        }

        string? validatedNewPasswordHash = null;
        if (hasPasswordChange)
        {
            if (req.NewPassword!.Length < 8)
                return BadRequest(new { message = "La nuova password deve contenere almeno 8 caratteri." });

            validatedNewPasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        }

        // Genera OTP e memorizza la modifica pendente per 10 minuti
        var otpCode = _otpService.CreatePendingChange(
            user.Id,
            user.Email,
            validatedNewEmail,
            validatedNewPasswordHash,
            TimeSpan.FromMinutes(10));

        var changeLabel = (hasPasswordChange && hasEmailChange)
            ? "password ed email"
            : hasPasswordChange ? "password" : "email";

        var emailSent = await _emailService.SendOtpEmailAsync(user.Email, user.Username, otpCode, changeLabel);
        if (!emailSent && _emailService.IsConfigured)
        {
            return StatusCode(500, new { message = "Impossibile inviare l'email con il codice di verifica. Riprova più tardi." });
        }

        var masked = MaskEmail(user.Email);
        return Ok(new RequestSensitiveChangeRes
        {
            Message = $"Codice di verifica inviato all'indirizzo {masked}.",
            MaskedEmail = masked,
            ExpiresInMinutes = 10
        });
    }

    /// <summary>
    /// Conferma e applica definitivamente la modifica di dati sensibili verificando l'OTP
    /// </summary>
    [HttpPost("sensitive/confirm")]
    public async Task<IActionResult> ConfirmSensitiveChange([FromBody] ConfirmSensitiveChangeReq req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.OtpCode))
            return BadRequest(new { message = "Inserisci il codice di verifica ricevuto via email." });

        if (!_otpService.TryValidateAndConsume(userId.Value, req.OtpCode, out var pending) || pending == null)
            return BadRequest(new { message = "Codice di verifica errato o scaduto. Richiedine uno nuovo." });

        var user = await _db.Users
            .Include(u => u.RRole)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null) return NotFound(new { message = "Utente non trovato." });

        var appliedChanges = new List<string>();

        if (!string.IsNullOrWhiteSpace(pending.NewEmail))
        {
            var emailTaken = await _db.Users
                .AnyAsync(u => u.Id != user.Id && u.Email.ToLower() == pending.NewEmail.ToLower());
            if (emailTaken)
                return Conflict(new { message = "L'indirizzo email specificato è già in uso da un altro utente." });

            user.Email = pending.NewEmail;
            appliedChanges.Add("Indirizzo Email");
        }

        if (!string.IsNullOrWhiteSpace(pending.NewPasswordHash))
        {
            user.Password = pending.NewPasswordHash;
            appliedChanges.Add("Password di accesso");
        }

        await _db.SaveChangesAsync();

        var changeSummary = string.Join(" e ", appliedChanges);

        // Invia notifica di conferma operazione
        var notifyEmail = user.Email;
        var username = user.Username;
        _ = Task.Run(async () =>
        {
            try
            {
                await _emailService.SendSecurityChangeConfirmedEmailAsync(notifyEmail, username, changeSummary);
            }
            catch
            {
                // Non blocca
            }
        });

        var roleName = user.RRole?.Name ?? "User";
        var newToken = _jwtService.GenToken(user, roleName, IsTvAppSession());

        return Ok(new ConfirmSensitiveChangeRes
        {
            Message = $"Impostazioni di sicurezza aggiornate con successo ({changeSummary}).",
            Email = user.Email,
            Token = newToken
        });
    }

    /// <summary>
    /// Modifica dati sensibili diretta (legacy/fallback)
    /// </summary>
    [HttpPut("sensitive")]
    public async Task<IActionResult> UpdateSensitive([FromBody] UpdateSensitiveReq req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.CurrentPassword))
            return BadRequest(new { message = "La password attuale è obbligatoria per modificare dati sensibili." });

        var user = await _db.Users
            .Include(u => u.RRole)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null) return NotFound(new { message = "Utente non trovato." });

        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.Password))
            return BadRequest(new { message = "Password attuale non valida. Modifica annullata." });

        var hasEmailChange = !string.IsNullOrWhiteSpace(req.NewEmail) &&
                             !string.Equals(req.NewEmail.Trim(), user.Email, StringComparison.OrdinalIgnoreCase);
        var hasPasswordChange = !string.IsNullOrWhiteSpace(req.NewPassword);

        if (!hasEmailChange && !hasPasswordChange)
            return BadRequest(new { message = "Nessuna modifica sensibile da salvare." });

        if (hasEmailChange)
        {
            var newEmail = req.NewEmail!.Trim();
            if (!new EmailAddressAttribute().IsValid(newEmail))
                return BadRequest(new { message = "Inserisci un indirizzo email valido." });

            var emailTaken = await _db.Users
                .AnyAsync(u => u.Id != user.Id && u.Email.ToLower() == newEmail.ToLower());

            if (emailTaken)
                return Conflict(new { message = "Questa email è già associata a un altro account." });

            user.Email = newEmail;
        }

        if (hasPasswordChange)
        {
            if (req.NewPassword!.Length < 8)
                return BadRequest(new { message = "La nuova password deve contenere almeno 8 caratteri." });

            user.Password = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        }

        await _db.SaveChangesAsync();

        var roleName = user.RRole?.Name ?? "User";
        var newToken = _jwtService.GenToken(user, roleName, IsTvAppSession());

        return Ok(new
        {
            message = "Impostazioni di sicurezza aggiornate con successo.",
            email = user.Email,
            token = newToken
        });
    }

    private static string MaskEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return string.Empty;
        var parts = email.Split('@');
        if (parts.Length != 2) return email;
        var local = parts[0];
        var visible = local.Length <= 2 ? local : local[..2];
        var masked = visible + new string('*', Math.Max(3, local.Length - visible.Length));
        return $"{masked}@{parts[1]}";
    }

    private void TryDeleteLocalAvatar(string? avatarUrl)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl) || !avatarUrl.StartsWith("/uploads/avatars/", StringComparison.OrdinalIgnoreCase))
            return;

        try
        {
            var relative = avatarUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(_env.ContentRootPath, relative);
            if (System.IO.File.Exists(fullPath))
                System.IO.File.Delete(fullPath);
        }
        catch
        {
            // Non bloccare l'operazione se il vecchio file non è cancellabile
        }
    }
}
