namespace BTime.Api.Models;

public partial class EpisodesD
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid REpisodeMid { get; set; }

    public Guid RUserId { get; set; }

    public int? StoppedAtSeconds { get; set; }

    public DateTime? LastWatchedAt { get; set; }

    public virtual EpisodesM REpisodeM { get; set; } = null!;

    public virtual Users RUsers { get; set; } = null!;
}

