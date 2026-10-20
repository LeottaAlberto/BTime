namespace BTime.Api.Features.Admin.Movies;

public class CreateSeasonReq
{
    public Guid SeriesId { get; set; }

    public int SeasonNumber { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public int? ReleaseYear { get; set; }
}

