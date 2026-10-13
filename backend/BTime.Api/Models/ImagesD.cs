using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class ImagesD
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RImageMId { get; set; }

    public Guid RMovieMId { get; set; }

    public virtual ImagesM RImageM { get; set; } = null!;
}
