using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class TagsM
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public virtual ICollection<TagsD> TagsDs { get; set; } = new List<TagsD>();
}
