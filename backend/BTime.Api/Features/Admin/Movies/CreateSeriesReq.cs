namespace BTime.Api.Features.Admin.Movies;

public class CreateSeriesReq
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? ReleaseYear { get; set; }

    public decimal? Rating { get; set; }

    public Guid? CoverImageId { get; set; }

    public string? CoverUrl { get; set; }

    public List<Guid> TagIds { get; set; } = [];

    public List<string> NewTags { get; set; } = [];
}

