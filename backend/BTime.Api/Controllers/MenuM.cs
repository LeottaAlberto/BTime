using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class MenuM
{
    public Guid Id { get; set; }

    public Guid? RMenuMid { get; set; }

    public Guid? RImageMid { get; set; }

    public string Name { get; set; } = null!;

    public string Route { get; set; } = null!;

    public int? DisplayOrder { get; set; }

    public bool? IsActive { get; set; }

    public virtual ICollection<MenuM> InverseRMenuM { get; set; } = new List<MenuM>();

    public virtual ICollection<MenuD> MenuDs { get; set; } = new List<MenuD>();

    public virtual ImagesM? RImageM { get; set; }

    public virtual MenuM? RMenuM { get; set; }
}
