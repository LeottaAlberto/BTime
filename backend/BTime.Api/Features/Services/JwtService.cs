using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BTime.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace BTime.Api.Features.Services;

public class JwtService(IConfiguration config)
{
    private readonly IConfiguration _config = config;

    public string GenToken(Users user, string roleName, bool isTvApp = false)
    {
        var jwtSettings = _config.GetSection("Jwt");
        var secretKey = jwtSettings["SecretKey"]!;

        // 1. I "Claims" sono le informazioni trasparenti salvate DENTRO il token
        var claims = new List<Claim>
        {
            new (ClaimTypes.NameIdentifier, user.Id.ToString()),
            new (ClaimTypes.Name, user.Username),
            new (ClaimTypes.Email, user.Email),
            new (ClaimTypes.Role, roleName)
        };

        if (isTvApp)
        {
            claims.Add(new Claim("client_app", "TvAppBTime"));
        }

        // Durata estesa per i dispositivi che si collegano tramite TvAppBTime (default: 43200 min = 30 giorni)
        var expiryMinutes = isTvApp
            ? (double.TryParse(jwtSettings["TvAppExpiryInMinutes"], out var tvExp) ? tvExp : 43200)
            : (double.TryParse(jwtSettings["ExpiryInMinutes"], out var stdExp) ? stdExp : 120);

        // 2. Creazione della chiave crittografica
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // 3. Generazione vera e propria del token JWT
        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
