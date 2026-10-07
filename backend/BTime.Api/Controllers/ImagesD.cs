using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class ImagesD
{
    public Guid Id { get; set; }

    public Guid RImageMid { get; set; }

    public Guid RMovieMid { get; set; }

    public virtual ImagesM RImageM { get; set; } = null!;
}
