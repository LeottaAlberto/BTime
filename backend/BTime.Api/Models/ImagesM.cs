using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class ImagesM
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Path { get; set; } = null!;

    public string Name { get; set; } = null!;

    public virtual ICollection<ImagesD> ImagesDs { get; set; } = [];

    public virtual ICollection<MenuM> MenuMs { get; set; } = [];

    public virtual ICollection<MoviesM> MoviesMs { get; set; } = [];
}
