using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class SeriesM
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? RImagesMid { get; set; }

    public Guid RUserId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public int? ReleaseYear { get; set; }

    public decimal? Rating { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<SeasonsM> SeasonsMs { get; set; } = new List<SeasonsM>();

    public virtual ImagesM? RImagesM { get; set; }

    public virtual Users RUsers { get; set; } = null!;

    public virtual ICollection<TagsD> TagsDs { get; set; } = new List<TagsD>();

    public virtual ICollection<ImagesD> ImagesDs { get; set; } = new List<ImagesD>();
}

