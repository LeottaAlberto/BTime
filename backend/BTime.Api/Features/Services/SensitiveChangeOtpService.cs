using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace BTime.Api.Features.Services;

public class PendingSensitiveChange
{
    public Guid UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty;
    public string? NewEmail { get; set; }
    public string? NewPasswordHash { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public int AttemptCount { get; set; }
}

public class SensitiveChangeOtpService
{
    private readonly ConcurrentDictionary<Guid, PendingSensitiveChange> _cache = new();

    /// <summary>
    /// Genera un codice OTP numerico a 6 cifre e registra la richiesta pendente
    /// </summary>
    public string CreatePendingChange(Guid userId, string userEmail, string? newEmail, string? newPasswordHash, TimeSpan? validity = null)
    {
        var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        var expiresAt = DateTime.UtcNow.Add(validity ?? TimeSpan.FromMinutes(10));

        var pending = new PendingSensitiveChange
        {
            UserId = userId,
            UserEmail = userEmail,
            OtpCode = code,
            NewEmail = newEmail,
            NewPasswordHash = newPasswordHash,
            ExpiresAtUtc = expiresAt,
            AttemptCount = 0
        };

        _cache[userId] = pending;
        return code;
    }

    /// <summary>
    /// Verifica e consuma (invalida) l'OTP per l'utente, prevenendo brute-force (max 5 tentativi errati)
    /// </summary>
    public bool TryValidateAndConsume(Guid userId, string code, out PendingSensitiveChange? change)
    {
        change = null;
        if (!_cache.TryGetValue(userId, out var pending))
        {
            return false;
        }

        if (DateTime.UtcNow > pending.ExpiresAtUtc)
        {
            _cache.TryRemove(userId, out _);
            return false;
        }

        pending.AttemptCount++;
        if (pending.AttemptCount > 5)
        {
            _cache.TryRemove(userId, out _);
            return false;
        }

        if (string.Equals(pending.OtpCode.Trim(), code.Trim(), StringComparison.Ordinal))
        {
            _cache.TryRemove(userId, out change);
            return true;
        }

        return false;
    }

    /// <summary>
    /// Cancella un'eventuale richiesta OTP pendente (es. se l'utente annulla la procedura)
    /// </summary>
    public void CancelPending(Guid userId)
    {
        _cache.TryRemove(userId, out _);
    }
}
