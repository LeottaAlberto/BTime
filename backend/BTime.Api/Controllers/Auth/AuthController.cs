using BTime.Api.Data;
using BTime.Api.Features.Auth.Login;
using BTime.Api.Features.Auth.Register;
using BTime.Api.Features.Services;
using BTime.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTime.Api.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController: ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtService _jwtS;

    public AuthController(AppDbContext db, JwtService jwtService)
    {
        _db = db;
        _jwtS = jwtService;
    }

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
            Username = user.Username,
            Email = user.Email,
            Role = roleName
        };

        return Ok(response);
    }

    [HttpPost("register")]
    [ProducesResponseType(typeof(LoginResponse), StatusCodes.Status200OK)]
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
}