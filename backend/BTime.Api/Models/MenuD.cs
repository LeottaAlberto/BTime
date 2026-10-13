using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class MenuD
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid? RMenuMid { get; set; }

    public Guid? RUserId { get; set; }

    public virtual MenuM? RMenuM { get; set; }

    public virtual Users? RUsers { get; set; }
}
