using System.Collections.Concurrent;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Security.Cryptography;
using BTime.Api.Features.Auth.Login;
using BTime.Api.Features.Auth.QrLogin;

namespace BTime.Api.Features.Services;

public enum QrSessionState
{
    Pending,
    Approved,
    Consumed,
    Expired
}

public class QrLoginSession
{
    public object SyncRoot { get; } = new();
    public string Code { get; init; } = string.Empty;
    public DateTime CreatedAtUtc { get; init; }
    public DateTime ExpiresAtUtc { get; init; }
    public string TvIpAddress { get; init; } = string.Empty;
    public string TvDeviceInfo { get; init; } = "TV";
    public bool IsTvAppBTime { get; init; }
    public QrSessionState State { get; set; } = QrSessionState.Pending;
    public LoginResponse? ApprovedLoginResponse { get; set; }
}

public class QrLoginService
{
    private static readonly TimeSpan SessionTtl = TimeSpan.FromMinutes(5);
    private readonly ConcurrentDictionary<string, QrLoginSession> _sessions = new();

    public QrLoginSession CreateSession(string ipAddress, string deviceInfo, bool isTvAppBTime)
    {
        CleanupExpiredSessions();

        var code = GenerateSecureCode();
        var now = DateTime.UtcNow;

        var session = new QrLoginSession
        {
            Code = code,
            CreatedAtUtc = now,
            ExpiresAtUtc = now.Add(SessionTtl),
            TvIpAddress = ipAddress,
            TvDeviceInfo = string.IsNullOrWhiteSpace(deviceInfo)
                ? (isTvAppBTime ? "TV (TvAppBTime)" : "TV")
                : deviceInfo,
            IsTvAppBTime = isTvAppBTime,
            State = QrSessionState.Pending
        };

        _sessions[code] = session;
        return session;
    }

    public QrLoginSession? GetPendingSession(string code)
    {
        if (string.IsNullOrWhiteSpace(code) || !_sessions.TryGetValue(code.Trim(), out var session))
            return null;

        lock (session.SyncRoot)
        {
            if (DateTime.UtcNow >= session.ExpiresAtUtc)
            {
                session.State = QrSessionState.Expired;
                _sessions.TryRemove(session.Code, out _);
                return null;
            }

            return session.State == QrSessionState.Pending ? session : null;
        }
    }

    public QrInfoResponse GetSessionInfo(string code)
    {
        if (string.IsNullOrWhiteSpace(code) || !_sessions.TryGetValue(code.Trim(), out var session))
        {
            return new QrInfoResponse { Valid = false, Status = "Expired", RemainingSeconds = 0 };
        }

        lock (session.SyncRoot)
        {
            var remaining = (int)Math.Max(0, (session.ExpiresAtUtc - DateTime.UtcNow).TotalSeconds);
            if (remaining <= 0)
            {
                session.State = QrSessionState.Expired;
                _sessions.TryRemove(session.Code, out _);
                return new QrInfoResponse { Valid = false, Status = "Expired", RemainingSeconds = 0 };
            }

            return new QrInfoResponse
            {
                Valid = session.State == QrSessionState.Pending,
                Status = session.State.ToString(),
                DeviceInfo = session.TvDeviceInfo,
                IsTvAppBTime = session.IsTvAppBTime,
                RemainingSeconds = remaining
            };
        }
    }

    public bool TryApproveSession(string code, LoginResponse response)
    {
        if (string.IsNullOrWhiteSpace(code) || !_sessions.TryGetValue(code.Trim(), out var session))
            return false;

        lock (session.SyncRoot)
        {
            if (DateTime.UtcNow >= session.ExpiresAtUtc)
            {
                session.State = QrSessionState.Expired;
                _sessions.TryRemove(session.Code, out _);
                return false;
            }

            if (session.State != QrSessionState.Pending)
                return false;

            session.ApprovedLoginResponse = response;
            session.State = QrSessionState.Approved;
            return true;
        }
    }

    public QrStatusResponse PollStatusAndConsume(string code)
    {
        if (string.IsNullOrWhiteSpace(code) || !_sessions.TryGetValue(code.Trim(), out var session))
        {
            return new QrStatusResponse { Status = "Expired", RemainingSeconds = 0 };
        }

        lock (session.SyncRoot)
        {
            var remaining = (int)Math.Max(0, (session.ExpiresAtUtc - DateTime.UtcNow).TotalSeconds);
            if (remaining <= 0)
            {
                session.State = QrSessionState.Expired;
                session.ApprovedLoginResponse = null;
                _sessions.TryRemove(session.Code, out _);
                return new QrStatusResponse { Status = "Expired", RemainingSeconds = 0 };
            }

            if (session.State == QrSessionState.Approved && session.ApprovedLoginResponse != null)
            {
                var loginRes = session.ApprovedLoginResponse;
                session.ApprovedLoginResponse = null;
                session.State = QrSessionState.Consumed;
                _sessions.TryRemove(session.Code, out _);

                return new QrStatusResponse
                {
                    Status = "Approved",
                    RemainingSeconds = remaining,
                    LoginResponse = loginRes
                };
            }

            if (session.State == QrSessionState.Pending)
            {
                return new QrStatusResponse
                {
                    Status = "Pending",
                    RemainingSeconds = remaining
                };
            }

            return new QrStatusResponse { Status = "Expired", RemainingSeconds = 0 };
        }
    }

    /// <summary>
    /// Rileva l'IP preferito del server (Tailscale 100.64.0.0/10 oppure LAN privata)
    /// utile come fallback se il client TV è aperto su localhost durante i test.
    /// </summary>
    public static string? GetPreferredServerHost()
    {
        try
        {
            string? lan192Candidate = null;
            string? tailscaleCandidate = null;
            string? lan10Candidate = null;

            foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus != OperationalStatus.Up ||
                    ni.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                    continue;

                var nameDesc = $"{ni.Name} {ni.Description}".ToLowerInvariant();
                if (nameDesc.Contains("vethernet") || nameDesc.Contains("wsl") || nameDesc.Contains("docker") || nameDesc.Contains("hyper-v"))
                    continue;

                var props = ni.GetIPProperties();
                foreach (var ua in props.UnicastAddresses)
                {
                    if (ua.Address.AddressFamily != AddressFamily.InterNetwork || IPAddress.IsLoopback(ua.Address))
                        continue;

                    var bytes = ua.Address.GetAddressBytes();
                    // Rete locale domestica 192.168.x.x (raggiungibile da smartphone in Wi-Fi anche senza VPN)
                    if (lan192Candidate == null && bytes[0] == 192 && bytes[1] == 168)
                    {
                        lan192Candidate = ua.Address.ToString();
                    }
                    // Tailscale CGNAT 100.64.0.0/10
                    else if (tailscaleCandidate == null && bytes[0] == 100 && bytes[1] >= 64 && bytes[1] <= 127)
                    {
                        tailscaleCandidate = ua.Address.ToString();
                    }
                    // Altra LAN privata 10.x.x.x
                    else if (lan10Candidate == null && bytes[0] == 10)
                    {
                        lan10Candidate = ua.Address.ToString();
                    }
                }
            }

            return lan192Candidate ?? tailscaleCandidate ?? lan10Candidate;
        }
        catch
        {
            return null;
        }
    }

    private void CleanupExpiredSessions()
    {
        var now = DateTime.UtcNow;
        foreach (var kvp in _sessions)
        {
            if (now >= kvp.Value.ExpiresAtUtc || kvp.Value.State == QrSessionState.Consumed)
            {
                _sessions.TryRemove(kvp.Key, out _);
            }
        }
    }

    private static string GenerateSecureCode()
    {
        Span<byte> bytes = stackalloc byte[16];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}

