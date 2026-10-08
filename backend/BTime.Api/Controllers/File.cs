using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class File
{
    public Guid Id { get; set; }

    public Guid? RFolderId { get; set; }

    public Guid RUserId { get; set; }

    public string Name { get; set; } = null!;

    public string Path { get; set; } = null!;

    public long SizeBytes { get; set; }

    public string MimeType { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual Folder? RFolder { get; set; }

    public virtual Users RUsers { get; set; } = null!;
}
