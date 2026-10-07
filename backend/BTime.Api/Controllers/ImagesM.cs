using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class ImagesM
{
    public Guid Id { get; set; }

    public string Path { get; set; } = null!;

    public string Name { get; set; } = null!;

    public virtual ICollection<ImagesD> ImagesDs { get; set; } = new List<ImagesD>();

    public virtual ICollection<MenuM> MenuMs { get; set; } = new List<MenuM>();

    public virtual ICollection<MoviesM> MoviesMs { get; set; } = new List<MoviesM>();
}
