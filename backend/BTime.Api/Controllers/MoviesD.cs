using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class MoviesD
{
    public Guid Id { get; set; }

    public Guid RMoviesMid { get; set; }

    public Guid RUserId { get; set; }

    public short? StoppedAtSeconds { get; set; }

    public DateTime? LastWatchedAt { get; set; }

    public virtual MoviesM RMoviesM { get; set; } = null!;

    public virtual User RUser { get; set; } = null!;
}
