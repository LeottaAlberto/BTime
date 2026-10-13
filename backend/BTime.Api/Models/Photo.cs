using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class Photo
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RUserId { get; set; }

    public Guid? RFolderId { get; set; }

    public string Name { get; set; } = null!;

    public string Path { get; set; } = null!;

    public string? ThumbnailPath { get; set; }

    public long Size { get; set; }

    public DateTime TakedAt { get; set; }

    public string? ExifDataJson { get; set; }

    public DateTime CreatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual Folder? RFolder { get; set; }

    public virtual Users RUsers { get; set; } = null!;
}
