using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class Role
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Users> Users { get; set; } = new List<Users>();
}
