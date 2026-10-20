namespace BTime.Api.Features.Dashboard.Movies;

/// <summary>
/// DTO di risposta per i media in sospeso (film ed episodi).
/// </summary>
public class WatchingMoviesRes : IWatchingMovies
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    public int MinuteLeft { get; set; }

    public int TotMinute { get; set; }

    public int Progress { get; set; }

    public int? StoppedAtSeconds { get; set; }

    public DateTime? LastWatchedAt { get; set; }

    public int? Season { get; set; }

    public int? Episode { get; set; }

    public string? EpName { get; set; }

    public string MediaType { get; set; } = "movie";
}

