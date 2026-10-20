namespace BTime.Api.Features.Dashboard.Movies;

public class SeriesCardRes
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int SeasonsCount { get; set; }

    public int? ReleaseYear { get; set; }

    public decimal? Rating { get; set; }

    public List<string> Tags { get; set; } = [];
}

