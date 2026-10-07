using System;
using System.Collections.Generic;

namespace BTime.Api.Models;

public partial class MenuD
{
    public Guid Id { get; set; }

    public Guid? RMenuMid { get; set; }

    public Guid? RUserId { get; set; }

    public virtual MenuM? RMenuM { get; set; }

    public virtual Users? RUser { get; set; }
}
