using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class Users
{
    public Guid Id { get; set; }

    public Guid RRoleId { get; set; }

    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Password { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public virtual ICollection<File> Files { get; set; } = new List<File>();

    public virtual ICollection<Folder> Folders { get; set; } = new List<Folder>();

    public virtual ICollection<MenuD> MenuDs { get; set; } = new List<MenuD>();

    public virtual ICollection<MoviesD> MoviesDs { get; set; } = new List<MoviesD>();

    public virtual ICollection<MoviesM> MoviesMs { get; set; } = new List<MoviesM>();

    public virtual ICollection<Photo> Photos { get; set; } = new List<Photo>();

    public virtual Role RRole { get; set; } = null!;
}
