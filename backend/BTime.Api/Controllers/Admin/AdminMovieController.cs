using System.Security.Claims;
using BTime.Api.Data;
using BTime.Api.Features.Admin.Movies;
using BTime.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTime.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/movies")]
[Authorize(Roles = "Admin")]
public class AdminMovieController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly IWebHostEnvironment _env = env;

    /// <summary>
    /// Verifica accesso admin
    /// </summary>
    [HttpGet("check-access")]
    public IActionResult CheckAccess()
    {
        return Ok(new { message = "Accesso autorizzato al pannello di amministrazione.", isAdmin = true });
    }

    /// <summary>
    /// Restituisce la lista di tutti i tag disponibili
    /// </summary>
    [HttpGet("tags")]
    public async Task<IActionResult> GetTags()
    {
        var tags = await _db.TagsMs
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .Select(t => new { t.Id, t.Name })
            .ToListAsync();

        return Ok(tags);
    }

    /// <summary>
    /// Modo 1: Upload fisico del file immagine di copertina dal browser
    /// </summary>
    [HttpPost("upload-cover")]
    public async Task<IActionResult> UploadCover([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Nessun file selezionato." });

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(ext))
            return BadRequest(new { message = "Formato file non supportato. Usa JPG, PNG o WEBP." });

        var coversDir = Path.Combine(_env.ContentRootPath, "uploads", "covers");
        if (!Directory.Exists(coversDir))
        {
            Directory.CreateDirectory(coversDir);
        }

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(coversDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var publicUrl = $"/uploads/covers/{fileName}";

        // Registra l'immagine nel DB
        var image = new ImagesM
        {
            Id = Guid.NewGuid(),
            Name = file.FileName,
            Path = publicUrl
        };

        _db.ImagesMs.Add(image);
        await _db.SaveChangesAsync();

        return Ok(new { imageId = image.Id, url = FormatUrl(publicUrl), fileName = file.FileName });
    }

    /// <summary>
    /// Modo 1: Upload fisico del file video dal browser
    /// </summary>
    [HttpPost("upload-video")]
    [RequestSizeLimit(10L * 1024 * 1024 * 1024)] // 10 GB
    public async Task<IActionResult> UploadVideo([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Nessun file video selezionato." });

        var allowedExtensions = new[] { ".mp4", ".mkv", ".webm", ".avi", ".mov" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!allowedExtensions.Contains(ext))
            return BadRequest(new { message = "Formato video non supportato. Usa MP4, MKV o WEBM." });

        var videosDir = Path.Combine(_env.ContentRootPath, "uploads", "videos");
        if (!Directory.Exists(videosDir))
        {
            Directory.CreateDirectory(videosDir);
        }

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(videosDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativePath = $"/uploads/videos/{fileName}";

        return Ok(new { path = relativePath, fullLocalPath = filePath, fileName = file.FileName });
    }

    /// <summary>
    /// Creazione film: supporta ENTRAMBI i modi (upload o path manuale/url)
    /// </summary>
    [HttpPost("create-movie")]
    public async Task<IActionResult> CreateMovie([FromBody] CreateMovieReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Il titolo del film è obbligatorio." });

        if (string.IsNullOrWhiteSpace(req.VideoPath))
            return BadRequest(new { message = "Il percorso o file del video è obbligatorio." });

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        // 1. Gestione Copertina (Upload Id oppure URL/Path manuale)
        Guid imageId;

        if (req.CoverImageId.HasValue && req.CoverImageId.Value != Guid.Empty)
        {
            imageId = req.CoverImageId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(req.CoverUrl))
        {
            var newImage = new ImagesM
            {
                Id = Guid.NewGuid(),
                Name = $"{req.Title} Cover",
                Path = req.CoverUrl.Trim()
            };
            _db.ImagesMs.Add(newImage);
            await _db.SaveChangesAsync();
            imageId = newImage.Id;
        }
        else
        {
            // Default fallback
            var defaultImage = new ImagesM
            {
                Id = Guid.NewGuid(),
                Name = "Default Cover",
                Path = "/hero-banner-fallback.jpg"
            };
            _db.ImagesMs.Add(defaultImage);
            await _db.SaveChangesAsync();
            imageId = defaultImage.Id;
        }

        // 2. Creazione Record Film
        var movie = new MoviesM
        {
            Id = Guid.NewGuid(),
            Title = req.Title.Trim(),
            Description = req.Description?.Trim(),
            Duration = req.Duration,
            Path = req.VideoPath.Trim(),
            RImagesMid = imageId,
            RUserId = userId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _db.MoviesMs.Add(movie);

        // 3. Associazione Tag Esistenti
        if (req.TagIds.Count > 0)
        {
            foreach (var tagId in req.TagIds.Distinct())
            {
                _db.TagsDs.Add(new TagsD
                {
                    Id = Guid.NewGuid(),
                    RMovieMid = movie.Id,
                    RTagMid = tagId
                });
            }
        }

        // 4. Creazione e Associazione Nuovi Tag
        if (req.NewTags.Count > 0)
        {
            foreach (var newTagName in req.NewTags.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).Distinct())
            {
                var existingTag = await _db.TagsMs.FirstOrDefaultAsync(t => t.Name.ToLower() == newTagName.ToLower());
                var tagId = existingTag?.Id ?? Guid.NewGuid();

                if (existingTag == null)
                {
                    var createdTag = new TagsM
                    {
                        Id = tagId,
                        Name = newTagName
                    };
                    _db.TagsMs.Add(createdTag);
                }

                _db.TagsDs.Add(new TagsD
                {
                    Id = Guid.NewGuid(),
                    RMovieMid = movie.Id,
                    RTagMid = tagId
                });
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new { message = "Film aggiunto con successo!", movieId = movie.Id });
    }

    /// <summary>
    /// Creazione di una nuova Serie TV
    /// </summary>
    [HttpPost("create-series")]
    public async Task<IActionResult> CreateSeries([FromBody] CreateSeriesReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Il titolo della serie è obbligatorio." });

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
            return Unauthorized();

        Guid? imageId = null;

        if (req.CoverImageId.HasValue && req.CoverImageId.Value != Guid.Empty)
        {
            imageId = req.CoverImageId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(req.CoverUrl))
        {
            var newImage = new ImagesM
            {
                Id = Guid.NewGuid(),
                Name = $"{req.Title} Cover",
                Path = req.CoverUrl.Trim()
            };
            _db.ImagesMs.Add(newImage);
            await _db.SaveChangesAsync();
            imageId = newImage.Id;
        }

        decimal? rating = null;
        if (req.Rating.HasValue)
        {
            rating = Math.Round(Math.Clamp(req.Rating.Value, 0m, 100m), 2);
        }

        var series = new SeriesM
        {
            Id = Guid.NewGuid(),
            Title = req.Title.Trim(),
            Description = req.Description?.Trim(),
            ReleaseYear = req.ReleaseYear,
            Rating = rating,
            RImagesMid = imageId,
            RUserId = userId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _db.SeriesMs.Add(series);

        // Associazione Tag
        if (req.TagIds.Count > 0)
        {
            foreach (var tagId in req.TagIds.Distinct())
            {
                _db.TagsDs.Add(new TagsD
                {
                    Id = Guid.NewGuid(),
                    RSeriesMid = series.Id,
                    RTagMid = tagId
                });
            }
        }

        if (req.NewTags.Count > 0)
        {
            foreach (var newTagName in req.NewTags.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).Distinct())
            {
                var existingTag = await _db.TagsMs.FirstOrDefaultAsync(t => t.Name.ToLower() == newTagName.ToLower());
                var tagId = existingTag?.Id ?? Guid.NewGuid();

                if (existingTag == null)
                {
                    var createdTag = new TagsM
                    {
                        Id = tagId,
                        Name = newTagName
                    };
                    _db.TagsMs.Add(createdTag);
                }

                _db.TagsDs.Add(new TagsD
                {
                    Id = Guid.NewGuid(),
                    RSeriesMid = series.Id,
                    RTagMid = tagId
                });
            }
        }

        await _db.SaveChangesAsync();

        return Ok(new { message = "Serie TV creata con successo!", seriesId = series.Id });
    }

    /// <summary>
    /// Aggiunta di una Stagione a una Serie TV esistente
    /// </summary>
    [HttpPost("create-season")]
    public async Task<IActionResult> CreateSeason([FromBody] CreateSeasonReq req)
    {
        var seriesExists = await _db.SeriesMs.AnyAsync(s => s.Id == req.SeriesId && !s.IsDeleted);
        if (!seriesExists)
            return NotFound(new { message = "Serie TV non trovata." });

        if (req.SeasonNumber <= 0)
            return BadRequest(new { message = "Il numero della stagione deve essere maggiore di zero." });

        var season = new SeasonsM
        {
            Id = Guid.NewGuid(),
            RSeriesMid = req.SeriesId,
            SeasonNumber = req.SeasonNumber,
            Title = string.IsNullOrWhiteSpace(req.Title) ? $"Stagione {req.SeasonNumber}" : req.Title.Trim(),
            Description = req.Description?.Trim(),
            ReleaseYear = req.ReleaseYear,
            CreatedAt = DateTime.UtcNow
        };

        _db.SeasonsMs.Add(season);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Stagione creata con successo!", seasonId = season.Id });
    }

    /// <summary>
    /// Aggiunta di un Episodio a una Stagione esistente
    /// </summary>
    [HttpPost("create-episode")]
    public async Task<IActionResult> CreateEpisode([FromBody] CreateEpisodeReq req)
    {
        var seasonExists = await _db.SeasonsMs.AnyAsync(s => s.Id == req.SeasonId);
        if (!seasonExists)
            return NotFound(new { message = "Stagione non trovata." });

        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Il titolo dell'episodio è obbligatorio." });

        if (string.IsNullOrWhiteSpace(req.VideoPath))
            return BadRequest(new { message = "Il file o percorso del video è obbligatorio." });

        Guid? imageId = null;

        if (req.CoverImageId.HasValue && req.CoverImageId.Value != Guid.Empty)
        {
            imageId = req.CoverImageId.Value;
        }
        else if (!string.IsNullOrWhiteSpace(req.CoverUrl))
        {
            var newImage = new ImagesM
            {
                Id = Guid.NewGuid(),
                Name = $"{req.Title} Ep Cover",
                Path = req.CoverUrl.Trim()
            };
            _db.ImagesMs.Add(newImage);
            await _db.SaveChangesAsync();
            imageId = newImage.Id;
        }

        var episode = new EpisodesM
        {
            Id = Guid.NewGuid(),
            RSeasonMid = req.SeasonId,
            EpisodeNumber = req.EpisodeNumber,
            Title = req.Title.Trim(),
            Description = req.Description?.Trim(),
            Duration = req.Duration,
            Path = req.VideoPath.Trim(),
            RImagesMid = imageId,
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        _db.EpisodesMs.Add(episode);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Episodio creato con successo!", episodeId = episode.Id });
    }

    /// <summary>
    /// Restituisce l'albero delle serie, stagioni ed episodi per la gestione da admin
    /// </summary>
    [HttpGet("series-tree")]
    public async Task<IActionResult> GetSeriesTree()
    {
        var rawSeries = await _db.SeriesMs
            .AsNoTracking()
            .Include(s => s.RImagesM)
            .Include(s => s.SeasonsMs)
                .ThenInclude(sea => sea.EpisodesMs)
            .Where(s => !s.IsDeleted)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        var series = rawSeries.Select(s => new
        {
            s.Id,
            s.Title,
            Icon = s.RImagesM != null ? FormatUrl(s.RImagesM.Path) : string.Empty,
            s.ReleaseYear,
            s.Rating,
            Seasons = s.SeasonsMs.OrderBy(sea => sea.SeasonNumber).Select(sea => new
            {
                sea.Id,
                sea.SeasonNumber,
                sea.Title,
                EpisodesCount = sea.EpisodesMs.Count(e => !e.IsDeleted),
                Episodes = sea.EpisodesMs.Where(e => !e.IsDeleted).OrderBy(e => e.EpisodeNumber).Select(e => new
                {
                    e.Id,
                    e.EpisodeNumber,
                    e.Title,
                    e.Duration,
                    e.Path
                })
            })
        });

        return Ok(series);
    }

    /// <summary>
    /// Restituisce la lista di tutti i film per la gestione admin
    /// </summary>
    [HttpGet("list")]
    public async Task<IActionResult> GetMoviesList()
    {
        var rawMovies = await _db.MoviesMs
            .AsNoTracking()
            .Include(m => m.RImagesM)
            .Include(m => m.TagsDs)
                .ThenInclude(td => td.RTagM)
            .Where(m => !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        var movies = rawMovies.Select(m => new
        {
            m.Id,
            m.Title,
            m.Description,
            m.Duration,
            m.Path,
            Cover = m.RImagesM != null ? FormatUrl(m.RImagesM.Path) : string.Empty,
            m.CreatedAt,
            Tags = m.TagsDs
                .Where(td => td.RTagM != null)
                .Select(td => td.RTagM.Name)
                .ToList()
        });

        return Ok(movies);
    }

    /// <summary>
    /// Creazione di un singolo Tag standalone
    /// </summary>
    [HttpPost("create-tag")]
    public async Task<IActionResult> CreateTag([FromBody] CreateTagReq req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Il nome del tag non può essere vuoto." });

        var name = req.Name.Trim();
        var existingTag = await _db.TagsMs.FirstOrDefaultAsync(t => t.Name.ToLower() == name.ToLower());
        if (existingTag != null)
            return Ok(new { message = "Tag già esistente.", id = existingTag.Id, name = existingTag.Name });

        var tag = new TagsM
        {
            Id = Guid.NewGuid(),
            Name = name
        };

        _db.TagsMs.Add(tag);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Tag creato con successo!", id = tag.Id, name = tag.Name });
    }

    /// <summary>
    /// Eliminazione soft di un film
    /// </summary>
    [HttpDelete("movie/{id}")]
    public async Task<IActionResult> DeleteMovie([FromRoute] Guid id)
    {
        var movie = await _db.MoviesMs.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);
        if (movie == null)
            return NotFound(new { message = "Film non trovato." });

        movie.IsDeleted = true;
        movie.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Film eliminato con successo." });
    }

    /// <summary>
    /// Eliminazione soft di una serie
    /// </summary>
    [HttpDelete("series/{id}")]
    public async Task<IActionResult> DeleteSeries([FromRoute] Guid id)
    {
        var series = await _db.SeriesMs.FirstOrDefaultAsync(s => s.Id == id && !s.IsDeleted);
        if (series == null)
            return NotFound(new { message = "Serie non trovata." });

        series.IsDeleted = true;
        series.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Serie eliminata con successo." });
    }

    /// <summary>
    /// Eliminazione soft di un episodio
    /// </summary>
    [HttpDelete("episode/{id}")]
    public async Task<IActionResult> DeleteEpisode([FromRoute] Guid id)
    {
        var ep = await _db.EpisodesMs.FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted);
        if (ep == null)
            return NotFound(new { message = "Episodio non trovato." });

        ep.IsDeleted = true;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Episodio eliminato con successo." });
    }

    private string FormatUrl(string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return string.Empty;
        if (path.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || path.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return path;
        return $"{Request.Scheme}://{Request.Host}{path}";
    }
}

