using System.Collections.Concurrent;
using BTime.Api.Enums;

namespace BTime.Api.Features.Services;

// Rappresenta un singolo utente connesso dentro una stanza
public class WatchPartyParticipant
{
    // ID univoco della connessione WebSocket assegnato da SignalR (cambia se ricarica la pagina)
    public string ConnectionId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public bool CanControl { get; set; }
    public bool IsHost { get; set; }
}

// Rappresenta l'intera stanza di Watch Party
public class WatchPartyRoom
{
    public string RoomCode { get; set; } = string.Empty;
    public string MediaId { get; set; } = string.Empty;
    public MediaType MediaType { get; set; } = MediaType.Episode;
    public string HostUserId { get; set; } = string.Empty;

    // Stato attuale del video (serve per sincronizzare chi entra in ritardo!)
    public bool IsPlaying { get; set; }
    public double CurrentTimeSeconds { get; set; }
    public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;

    // Lista dei partecipanti connessi
    public List<WatchPartyParticipant> Participants { get; set; } = [];
}

public class WatchPartyService
{
    // Dizionario Thread-Safe: Chiave = RoomCode (es. "X7K9P2"), Valore = Oggetto Stanza
    private readonly ConcurrentDictionary<string, WatchPartyRoom> _rooms = new();

    // Dizionario inverso per sapere velocemente in quale stanza si trova una ConnectionId
    // (Fondamentale quando un utente chiude il browser di colpo e scatta OnDisconnectedAsync)
    private readonly ConcurrentDictionary<string, string> _connectionToRoom = new();

    // Crea una nuova stanza e imposta il creatore come Host con permessi di controllo
    public WatchPartyRoom CreateRoom(string connectionId, string userId, string username, string mediaId, MediaType mediaType)
    {
        var roomCode = GenerateRoomCode();

        var room = new WatchPartyRoom
        {
            RoomCode = roomCode,
            MediaId = mediaId,
            MediaType = mediaType,
            HostUserId = userId,
            IsPlaying = false,
            CurrentTimeSeconds = 0,
            LastUpdatedUtc = DateTime.UtcNow,
            Participants =
            [
                new WatchPartyParticipant
                {
                    ConnectionId = connectionId,
                    UserId = userId,
                    Username = username,
                    CanControl = true,
                    IsHost = true
                }
            ]
        };

        _rooms[roomCode] = room;
        _connectionToRoom[connectionId] = roomCode;
        return room;
    }

    // Fa entrare un utente in una stanza esistente
    public WatchPartyRoom? JoinRoom(string roomCode, string connectionId, string userId, string username)
    {
        // Normalizza il codice in maiuscolo per evitare problemi se l'utente lo scrive minuscolo
        var normalizedCode = roomCode.Trim().ToUpperInvariant();

        if (!_rooms.TryGetValue(normalizedCode, out var room))
            return null; // Stanza inesistente

        lock (room)
        {
            // Se lo stesso utente aveva già una vecchia connessione appesa, la rimuoviamo
            room.Participants.RemoveAll(p => p.UserId == userId);

            // Se per caso rientra chi era già l'Host originale, gli ridiamo i poteri
            var isHost = room.HostUserId == userId;

            room.Participants.Add(new WatchPartyParticipant
            {
                ConnectionId = connectionId,
                UserId = userId,
                Username = username,
                CanControl = isHost,
                IsHost = isHost
            });
        }

        _connectionToRoom[connectionId] = normalizedCode;
        return room;
    }

    // Permette all'Host di dare o togliere i comandi a un altro partecipante
    public WatchPartyRoom? SetControlPermission(string roomCode, string callerUserId, string targetUserId, bool allowControl)
    {
        var normalizedCode = roomCode.Trim().ToUpperInvariant();

        if (!_rooms.TryGetValue(normalizedCode, out var room))
            return null;

        lock (room)
        {
            // SICUREZZA LATO SERVER: solo l'Host può cambiare i permessi!
            if (room.HostUserId != callerUserId)
                return null;

            // L'Host non può togliere i comandi a se stesso
            if (targetUserId == room.HostUserId)
                return room;

            var target = room.Participants.FirstOrDefault(p => p.UserId == targetUserId);
            target?.CanControl = allowControl;
        }

        return room;
    }

    // Verifica se un utente ha il permesso di inviare Play/Pausa/Seek e aggiorna lo stato della stanza
    public bool TryUpdatePlaybackState(string roomCode, string userId, double currentTime, bool isPlaying)
    {
        var normalizedCode = roomCode.Trim().ToUpperInvariant();
        if (!_rooms.TryGetValue(normalizedCode, out var room))
            return false;

        lock (room)
        {
            var participant = room.Participants.FirstOrDefault(p => p.UserId == userId);
            // SICUREZZA LATO SERVER: se l'utente non ha CanControl, ignoriamo il suo comando!
            if (participant == null || !participant.CanControl)
                return false;

            room.CurrentTimeSeconds = currentTime;
            room.IsPlaying = isPlaying;
            room.LastUpdatedUtc = DateTime.UtcNow;
            return true;
        }
    }

    // Permette a chi ha i comandi di cambiare episodio/film mantenendo intatta la stanza
    public WatchPartyRoom? TryChangeMedia(string roomCode, string userId, string newMediaId, MediaType newMediaType)
    {
        var normalizedCode = roomCode.Trim().ToUpperInvariant();
        if (!_rooms.TryGetValue(normalizedCode, out var room))
            return null;

        lock (room)
        {
            var participant = room.Participants.FirstOrDefault(p => p.UserId == userId);
            if (participant == null || !participant.CanControl)
                return null;

            room.MediaId = newMediaId;
            room.MediaType = newMediaType;
            room.CurrentTimeSeconds = 0;
            room.IsPlaying = true;
            room.LastUpdatedUtc = DateTime.UtcNow;
            return room;
        }
    }

    // Rimuove un utente quando si disconnette o esce dalla stanza
    public (WatchPartyRoom? Room, bool RoomClosed) RemoveByConnectionId(string connectionId)
    {
        if (!_connectionToRoom.TryRemove(connectionId, out var roomCode))
            return (null, false);

        if (!_rooms.TryGetValue(roomCode, out var room))
            return (null, false);

        lock (room)
        {
            var leaving = room.Participants.FirstOrDefault(p => p.ConnectionId == connectionId);
            if (leaving == null)
                return (room, false);

            room.Participants.Remove(leaving);

            // Se non è rimasto più nessuno nella stanza, la eliminiamo dalla memoria
            if (room.Participants.Count == 0)
            {
                _rooms.TryRemove(roomCode, out _);
                return (null, true);
            }

            // Se è uscito l'Host ma ci sono altri spettatori, passiamo la corona al primo rimasto!
            if (leaving.IsHost)
            {
                var nextHost = room.Participants[0];
                nextHost.IsHost = true;
                nextHost.CanControl = true;
                room.HostUserId = nextHost.UserId;
            }

            return (room, false);
        }
    }

    private static string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Esclusi 0/O e 1/I per non confonderli
        return new string([.. Enumerable.Range(0, 6).Select(_ => chars[Random.Shared.Next(chars.Length)])]);
    }
}