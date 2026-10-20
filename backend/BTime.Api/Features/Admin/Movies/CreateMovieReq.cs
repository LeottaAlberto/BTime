namespace BTime.Api.Features.Admin.Movies;

public class CreateMovieReq
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public int? Duration { get; set; }

    /// <summary>
    /// ID dell'immagine precedentemente caricata tramite upload
    /// </summary>
    public Guid? CoverImageId { get; set; }

    /// <summary>
    /// URL o percorso personalizzato della copertina (Modo manuale/URL)
    /// </summary>
    public string? CoverUrl { get; set; }

    /// <summary>
    /// Percorso del file video (può provenire da upload su server o da un path locale sul filesystem es. 'D:\Film\Film.mp4')
    /// </summary>
    public string VideoPath { get; set; } = string.Empty;

    /// <summary>
    /// Lista di ID di tag/generi esistenti
    /// </summary>
    public List<Guid> TagIds { get; set; } = [];

    /// <summary>
    /// Nuovi tag/generi da creare al volo
    /// </summary>
    public List<string> NewTags { get; set; } = [];
}

