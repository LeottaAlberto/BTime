using System.Security.Claims;
using BTime.Api.Enums;
using BTime.Api.Features.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace BTime.Api.Hubs;

[Authorize]
public class WatchPartyHub(WatchPartyService partyService) : Hub
{
    private readonly WatchPartyService _partyService = partyService;

    // Helper per estrarre l'ID utente e lo Username dai Claim del tuo JwtService
    private (string UserId, string Username) GetCurrentUser()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? Context.ConnectionId;
        var username = Context.User?.FindFirstValue(ClaimTypes.Name) ?? "Ospite";
        return (userId, username);
    }

    // Chiamato dal frontend per CREARE una stanza guardando un film/episodio
    public async Task CreateParty(string mediaId, MediaType mediaType)
    {
        var (userId, username) = GetCurrentUser();
        var room = _partyService.CreateRoom(Context.ConnectionId, userId, username, mediaId, mediaType);

        // Aggiunge la connessione WebSocket corrente al gruppo SignalR identificato dal RoomCode
        await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomCode);

        // Risponde SOLO al creatore inviando i dettagli della stanza creata
        await Clients.Caller.SendAsync("PartyJoined", room);
    }

    // Chiamato dal frontend quando un altro utente inserisce il codice stanza
    public async Task JoinParty(string roomCode)
    {
        var (userId, username) = GetCurrentUser();
        var room = _partyService.JoinRoom(roomCode, Context.ConnectionId, userId, username);

        if (room == null)
        {
            await Clients.Caller.SendAsync("PartyError", "Stanza non trovata o scaduta.");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomCode);

        // Se il video è già in play da qualche secondo, calcoliamo il tempo stimato reale adesso
        // (Tempo salvato + secondi trascorsi dall'ultimo aggiornamento)
        var estimatedTime = room.IsPlaying
            ? room.CurrentTimeSeconds + (DateTime.UtcNow - room.LastUpdatedUtc).TotalSeconds
            : room.CurrentTimeSeconds;

        // Mandiamo al nuovo arrivato tutto lo stato della stanza + il secondo esatto a cui saltare
        await Clients.Caller.SendAsync("PartyJoined", new
        {
            room.RoomCode,
            room.MediaId,
            room.MediaType,
            room.HostUserId,
            room.IsPlaying,
            CurrentTimeSeconds = estimatedTime,
            room.Participants
        });

        // Avvisiamo TUTTI GLI ALTRI nella stanza che la lista partecipanti è cambiata
        await Clients.OthersInGroup(room.RoomCode).SendAsync("ParticipantsUpdated", room.Participants);
    }

    // Chiamato quando qualcuno con i permessi preme Play, Pausa, Seek o manda un heartbeat
    public async Task SendSyncAction(string roomCode, string action, double currentTime, bool isPlaying)
    {
        var (userId, username) = GetCurrentUser();

        // Verifica sul server che l'utente abbia davvero CanControl == true
        var allowed = _partyService.TryUpdatePlaybackState(roomCode, userId, currentTime, isPlaying);
        if (!allowed)
            return;

        // Inoltriamo il comando SOLO AGLI ALTRI nella stanza (OthersInGroup) per evitare il loop!
        await Clients.OthersInGroup(roomCode).SendAsync("ReceiveSyncAction", new
        {
            Action = action, // es: "play", "pause", "seek", "heartbeat"
            CurrentTime = currentTime,
            IsPlaying = isPlaying,
            TriggeredBy = username
        });
    }

    // 4. Chiamato da chi ha i comandi per passare all'episodio successivo senza chiudere la stanza
    public async Task ChangeMedia(string roomCode, string newMediaId, MediaType newMediaType)
    {
        var (userId, username) = GetCurrentUser();
        var room = _partyService.TryChangeMedia(roomCode, userId, newMediaId, newMediaType);

        if (room == null)
            return;

        await Clients.Group(room.RoomCode).SendAsync("MediaChanged", new
        {
            MediaId = room.MediaId,
            MediaType = room.MediaType,
            CurrentTimeSeconds = room.CurrentTimeSeconds,
            IsPlaying = room.IsPlaying,
            TriggeredBy = username
        });
    }

    // 5. Chiamato dall'Host per dare o togliere i comandi a un altro utente
    public async Task ToggleParticipantControl(string roomCode, string targetUserId, bool allowControl)
    {
        var (callerUserId, _) = GetCurrentUser();
        var room = _partyService.SetControlPermission(roomCode, callerUserId, targetUserId, allowControl);

        if (room == null)
            return;

        // Aggiorniamo la lista partecipanti a TUTTI (Host compreso, così la UI si aggiorna)
        await Clients.Group(room.RoomCode).SendAsync("ParticipantsUpdated", room.Participants);
    }

    // Uscita volontaria dalla stanza
    public async Task LeaveParty()
    {
        await HandleDisconnectAsync();
    }

    // Scatta AUTOMATICAMENTE quando un client perde internet o chiude la scheda/TV
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await HandleDisconnectAsync();
        await base.OnDisconnectedAsync(exception);
    }

    private async Task HandleDisconnectAsync()
    {
        var (room, roomClosed) = _partyService.RemoveByConnectionId(Context.ConnectionId);
        if (room != null && !roomClosed)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, room.RoomCode);
            // Avvisa i rimasti della nuova lista partecipanti (ed eventuale nuovo Host)
            await Clients.Group(room.RoomCode).SendAsync("ParticipantsUpdated", room.Participants);
        }
    }
}