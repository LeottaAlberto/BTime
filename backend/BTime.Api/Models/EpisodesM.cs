namespace BTime.Api.Models;

public partial class EpisodesM
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RSeasonMid { get; set; }

    public Guid? RImagesMid { get; set; }

    public int EpisodeNumber { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string Path { get; set; } = null!;

    public int? Duration { get; set; }

    public int ViewCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;

    public DateTime? DeletedAt { get; set; }

    public virtual SeasonsM RSeasonM { get; set; } = null!;

    public virtual ImagesM? RImagesM { get; set; }

    public virtual ICollection<EpisodesD> EpisodesDs { get; set; } = [];
}

