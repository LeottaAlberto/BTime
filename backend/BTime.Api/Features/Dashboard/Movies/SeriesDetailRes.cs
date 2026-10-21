namespace BTime.Api.Features.Dashboard.Movies;

public class SeriesDetailRes
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int SeasonsCount { get; set; }

    public int? ReleaseYear { get; set; }

    public decimal? Rating { get; set; }

    public List<string> Tags { get; set; } = [];

    public List<SeasonDetailRes> Seasons { get; set; } = [];
}

public class SeasonDetailRes
{
    public Guid Id { get; set; }

    public int SeasonNumber { get; set; }

    public string? Title { get; set; }

    public int EpisodesCount { get; set; }

    public List<EpisodeDetailRes> Episodes { get; set; } = [];
}

public class EpisodeDetailRes
{
    public Guid Id { get; set; }

    public int EpisodeNumber { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? Duration { get; set; }

    public string Path { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;
}

