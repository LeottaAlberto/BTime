namespace BTime.Api.Features.Admin.Movies;

public class UpdateMovieReq
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? Duration { get; set; }
    public Guid? CoverImageId { get; set; }
    public string? CoverUrl { get; set; }
    public string? VideoPath { get; set; }
    public List<Guid>? TagIds { get; set; }
    public List<string>? NewTags { get; set; }
}

public class UpdateSeriesReq
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ReleaseYear { get; set; }
    public decimal? Rating { get; set; }
    public Guid? CoverImageId { get; set; }
    public string? CoverUrl { get; set; }
    public List<Guid>? TagIds { get; set; }
    public List<string>? NewTags { get; set; }
}

public class UpdateSeasonReq
{
    public int SeasonNumber { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? ReleaseYear { get; set; }
}

public class UpdateEpisodeReq
{
    public Guid? SeasonId { get; set; }
    public int EpisodeNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? Duration { get; set; }
    public string? VideoPath { get; set; }
    public Guid? CoverImageId { get; set; }
    public string? CoverUrl { get; set; }
}

public class UpdateTagReq
{
    public string Name { get; set; } = string.Empty;
}
