namespace BTime.Api.Features.Dashboard.Movies;

/// <summary>
/// Contratto per i film e gli episodi delle serie TV attualmente in sospeso (Continue Watching).
/// Allineato 1:1 con l'interfaccia WatchingMovies del frontend Angular.
/// </summary>
public interface IWatchingMovies
{
    Guid Id { get; set; }
    string Title { get; set; }
    string Icon { get; set; }
    int MinuteLeft { get; set; }
    int TotMinute { get; set; }
    int Progress { get; set; }
    int? StoppedAtSeconds { get; set; }
    DateTime? LastWatchedAt { get; set; }
    int? Season { get; set; }
    int? Episode { get; set; }
    string? EpName { get; set; }
    string MediaType { get; set; }
}

