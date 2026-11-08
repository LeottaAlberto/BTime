using BTime.Api.Enums;

namespace BTime.Api.Features.Dashboard.Movies;

public class SaveProgressReq
{
    public Guid Id { get; set; }

    public MediaType Type { get; set; }

    public int Duration { get; set; }

    public int ProgressSecond { get; set; }
}