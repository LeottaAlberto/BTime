using System.Security.Claims;
using System.Text;
using BTime.Api.Data;
using BTime.Api.Features.Services;
using BTime.Api.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Configurazione limiti dimensione upload per file video
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 10L * 1024 * 1024 * 1024; // 10 GB
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 10L * 1024 * 1024 * 1024; // 10 GB
});

// Database Context
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// Registrazione Servizi Applicativi
builder.Services.AddScoped<JwtService>();
builder.Services.AddSingleton<QrLoginService>();
builder.Services.AddSignalR();
builder.Services.AddSingleton<WatchPartyService>();
builder.Services.AddSingleton<EmailService>();
builder.Services.AddSingleton<SensitiveChangeOtpService>();

// Configurazione Autenticazione & Autorizzazione JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(secretKey),

        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],

        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],

        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,

        RoleClaimType = ClaimTypes.Role,
        NameClaimType = ClaimTypes.Name
    };

    options.Events = new JwtBearerEvents
    {
        // Questo evento scatta OGNI volta che arriva una richiesta da autenticare
        OnMessageReceived = context =>
        {
            // Leggiamo il token dalla query string (?access_token=...)
            var accessToken = context.Request.Query["access_token"];

            // Verifichiamo se la richiesta è diretta al nostro Hub SignalR
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/watch-party"))
                context.Token = accessToken; // Consegniamo il token al middleware JWT che lo validerà normalmente

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
});

// Controllers
builder.Services.AddControllers();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS Policy per Angular Client
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Supporto per reverse proxy (Nginx su Linux) per inoltrare correttamente IP, protocollo e host client
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost
});

// Cartella per upload fisici (copertine, video, audio, foto, file)
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

// Assicura l'esistenza di tutte le sottocartelle multimediali supportate
string[] subdirs = ["covers", "videos", "photos", "files", "audio", "wallpapers", "avatars"];
foreach (var sub in subdirs)
{
    var p = Path.Combine(uploadsPath, sub);
    if (!Directory.Exists(p)) Directory.CreateDirectory(p);
}

// Configurazione MIME types per lo streaming fluido di video, audio e immagini
var contentTypeProvider = new FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".mkv"] = "video/x-matroska";
contentTypeProvider.Mappings[".webm"] = "video/webm";
contentTypeProvider.Mappings[".mp4"] = "video/mp4";
contentTypeProvider.Mappings[".avi"] = "video/x-msvideo";
contentTypeProvider.Mappings[".mov"] = "video/quicktime";
contentTypeProvider.Mappings[".mp3"] = "audio/mpeg";
contentTypeProvider.Mappings[".wav"] = "audio/wav";
contentTypeProvider.Mappings[".flac"] = "audio/flac";
contentTypeProvider.Mappings[".aac"] = "audio/aac";
contentTypeProvider.Mappings[".ogg"] = "audio/ogg";
contentTypeProvider.Mappings[".webp"] = "image/webp";

// Serve i file della cartella 'uploads' via HTTP all'indirizzo /uploads/... con supporto Range requests (HTTP 206)
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
    ContentTypeProvider = contentTypeProvider,
    ServeUnknownFileTypes = true
});

// Swagger
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "BTime.Api v1"));

// CORS
app.UseCors("AllowAngularApp");

// Global Exception Handler che preserva gli header CORS e restituisce JSON
app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            message = "Si è verificato un errore interno del server.",
            statusCode = 500
        });
    });
});

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Health Check (Verifica stato server e connettività DB)
app.MapGet("/health", async (AppDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return canConnect
            ? Results.Ok(new { status = "Healthy", database = "Connected" })
            : Results.StatusCode(503);
    }
    catch
    {
        return Results.StatusCode(503);
    }
}).AllowAnonymous();

// Controllers
app.MapControllers();

// Mappa l'endpoint WebSocket/SignalR per le Watch Party
app.MapHub<WatchPartyHub>("/hubs/watch-party");

// Assicura in modo idempotente la colonna AvatarUrl sulla tabella Users
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.ExecuteSqlRawAsync(
            """ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "AvatarUrl" character varying(500);""");
    }
    catch
    {
        // Ignora se il DB non è raggiungibile all'avvio o gestito tramite migrazioni
    }
}

app.Run();
