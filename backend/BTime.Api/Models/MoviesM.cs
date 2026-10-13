using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class MoviesM
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RImagesMid { get; set; }

    public Guid RUserId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public string Path { get; set; } = null!;

    public int? Duration { get; set; }

    public short ViewCount { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<MoviesD> MoviesDs { get; set; } = new List<MoviesD>();

    public virtual ImagesM RImagesM { get; set; } = null!;

    public virtual Users RUsers { get; set; } = null!;

    public virtual ICollection<TagsD> TagsDs { get; set; } = new List<TagsD>();
}
