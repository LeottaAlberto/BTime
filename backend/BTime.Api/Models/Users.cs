namespace BTime.Api.Models;

public partial class Users
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid RRoleId { get; set; }

    public string Username { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Password { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public virtual ICollection<File> Files { get; set; } = [];

    public virtual ICollection<Folder> Folders { get; set; } = [];

    public virtual ICollection<MenuD> MenuDs { get; set; } = [];

    public virtual ICollection<MoviesD> MoviesDs { get; set; } = [];

    public virtual ICollection<MoviesM> MoviesMs { get; set; } = [];

    public virtual ICollection<Photo> Photos { get; set; } = [];

    public virtual Role RRole { get; set; } = null!;
}
