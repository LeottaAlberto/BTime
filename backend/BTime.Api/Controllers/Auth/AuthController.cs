using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BTime.Api.Data;
using BTime.Api.Features.Auth.Login;
using BTime.Api.Features.Auth.RefreshToken;
using BTime.Api.Features.Auth.Register;
using BTime.Api.Features.Services;
using BTime.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BTime.Api.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, JwtService jwtService, IConfiguration config) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly JwtService _jwtS = jwtService;

    private readonly IConfiguration _config = config;

    private readonly int EXPIRY_DAYS = 7;

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
            .FirstOrDefaultAsync(u => u.Username == req.Username && u.Email == req.Email);
        // Verifica utente e password
        if (user == null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(req.Password, user.Password))
            return Unauthorized(new { message = "Credenziali non valide o utente disattivato." });

        // Genera il token tramite JwtService
        var roleName = user.RRole?.Name ?? "User";
        var token = _jwtS.GenToken(user, roleName);

        // Aggiorna timestamp ultimo login
        user.LastLoginAt = DateTime.Now;

        await _db.SaveChangesAsync();

        // Restituisce il DTO di risposta
        var response = new LoginResponse
        {
            Token = token,
            RefreshToken = await GenerateRefrashToken(user.Id, req.IpAddress, req.DeviceInfo),
            Username = user.Username,
            Email = user.Email,
            Role = roleName
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

        // Questo metodo spacchetta il token. Se la firma è falsificata, lancia un'eccezione.
        // Se è tutto ok, ti restituisce il "principal" contenente i claims.
        var principal = tokenHandler.ValidateToken(req.JwtToken, tokenValidationParameters, out SecurityToken securityToken);

        // Estrarre l'ID
        var uIdStr = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (uIdStr == null)
            return Unauthorized("Token non valido");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id.ToString().Equals(uIdStr));

        if (user == null)
            return Unauthorized("Errore nella generazione del Token"); 

        var s = await GenerateRefrashToken(user.Id) ?? "";

        if (s == null || s == string.Empty)
            return Unauthorized("Errore nella generazione del Token");

        var res = new RefreshTokenRes() {
            JwtToken = _jwtS.GenToken(user, user.RRole?.Name ?? "User"),
            RefreshToken = s
        };

        return Ok(res);
    }

    private async Task<string> GenerateRefrashToken(Guid userId, string ipAddr = "", string devInfo = "")
    {
        var refreshToken = Guid.NewGuid().ToString();
        var expDate = DateTime.UtcNow.AddDays(EXPIRY_DAYS);

        if (!await UpdateRefreshTokenIntoDB(userId, refreshToken, expDate, ipAddr, devInfo))
            return string.Empty;

        return refreshToken;
    }

    private async Task<bool> UpdateRefreshTokenIntoDB(Guid userId, string newToken, DateTime eDate, string ipAddr = "", string devInfo = "")
    {
        try
        {
            var uDevAc = await _db.UserDeviceActive.FirstOrDefaultAsync(u => u.R_UserId == userId && u.IpAddress == ipAddr);

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
