namespace BTime.Api.Models;

public partial class Role
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Users> Users { get; set; } = [];

    public static implicit operator Guid(Role v)
    {
        return v?.Id ?? Guid.NewGuid();
    }
}
