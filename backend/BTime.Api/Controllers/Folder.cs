using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class Folder
{
    public Guid Id { get; set; }

    public Guid? RFolderId { get; set; }

    public Guid RUserId { get; set; }

    public string Name { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<File> Files { get; set; } = new List<File>();

    public virtual ICollection<Folder> InverseRFolder { get; set; } = new List<Folder>();

    public virtual ICollection<Photo> Photos { get; set; } = new List<Photo>();

    public virtual Folder? RFolder { get; set; }

    public virtual Users RUsers { get; set; } = null!;
}
