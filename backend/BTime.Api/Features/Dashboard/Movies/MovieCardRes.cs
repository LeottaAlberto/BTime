namespace BTime.Api.Features.Dashboard.Movies;

public class MovieCardRes
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? Duration { get; set; }

    public int? ReleaseYear { get; set; }

    public short ViewCount { get; set; }

    public List<string> Tags { get; set; } = [];
}

