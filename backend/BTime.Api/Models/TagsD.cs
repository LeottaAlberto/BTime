using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class TagsD
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RTagMid { get; set; }

    public Guid RMovieMid { get; set; }

    public virtual MoviesM RMovieM { get; set; } = null!;

    public virtual TagsM RTagM { get; set; } = null!;
}
