using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class Folder
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? RFolderId { get; set; }

    public Guid RUserId { get; set; }

    public string Name { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<File> Files { get; set; } = [];

    public virtual ICollection<Folder> InverseRFolder { get; set; } = [];

    public virtual ICollection<Photo> Photos { get; set; } = [];

    public virtual Folder? RFolder { get; set; }

    public virtual Users RUsers { get; set; } = null!;
}
