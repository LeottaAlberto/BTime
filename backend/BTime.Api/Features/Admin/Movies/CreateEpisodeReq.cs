namespace BTime.Api.Features.Admin.Movies;

public class CreateEpisodeReq
{
    public Guid SeasonId { get; set; }

    public int EpisodeNumber { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? Duration { get; set; }

    public string VideoPath { get; set; } = string.Empty;

    public Guid? CoverImageId { get; set; }

    public string? CoverUrl { get; set; }
}

