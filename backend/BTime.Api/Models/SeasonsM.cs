using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class SeasonsM
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RSeriesMid { get; set; }

    public int SeasonNumber { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public int? ReleaseYear { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual SeriesM RSeriesM { get; set; } = null!;

    public virtual ICollection<EpisodesM> EpisodesMs { get; set; } = new List<EpisodesM>();
}

