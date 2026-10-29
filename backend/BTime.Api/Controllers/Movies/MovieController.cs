using System.Security.Claims;
using BTime.Api.Data;
using BTime.Api.Features.Dashboard.Movies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BTime.Api.Controllers.Dashboard
{
    [ApiController]
    [Route("api/dashboard/movies")]
    [Authorize]
    public class MovieController(AppDbContext db) : ControllerBase
    {
        private readonly AppDbContext _db = db;

        [HttpGet("hero-banner")]
        public async Task<ActionResult<HeroBannerRes>> GetHeroBanner()
        {
            var r = await _db.MoviesMs
                .AsNoTracking()
                .Include(m => m.RImagesM)
                .Include(m => m.TagsDs)
                    .ThenInclude(td => td.RTagM)
                .Where(m => !m.IsDeleted)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefaultAsync();

            if (r == null)
            {
                return Ok(new HeroBannerRes
                {
                    HeroTitle = string.Empty,
                    Description = string.Empty,
                    Icon = "/hero-banner-fallback.jpg",
                    Tags = []
                });
            }

            var banner = new HeroBannerRes
            {
                HeroTitle = r.Title,
                Icon = !string.IsNullOrEmpty(r.RImagesM?.Path) ? FormatUrl(r.RImagesM.Path) : "/hero-banner-fallback.jpg",
                Description = r.Description ?? string.Empty,
                Tags = [.. r.TagsDs
                    .Where(td => td.RTagM != null)
                    .Select(td => td.RTagM.Name)]
            };

            return Ok(banner);
        }

        [HttpGet("watching-movies")]
        [HttpGet("continue-watching")]
        public async Task<ActionResult<List<WatchingMoviesRes>>> GetWatchingMovies()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid.TryParse(userIdClaim, out var userId);

            // 1. Recupero film in sospeso (MoviesD)
            var watchingMovies = await _db.MoviesDs
                .AsNoTracking()
                .Include(md => md.RMoviesM)
                    .ThenInclude(m => m.RImagesM)
                .Where(md => (userId == Guid.Empty || md.RUserId == userId) && !md.RMoviesM.IsDeleted)
                .OrderByDescending(md => md.LastWatchedAt)
                .ToListAsync();

            // 2. Recupero episodi in sospeso (EpisodesD)
            var watchingEpisodes = await _db.EpisodesDs
                .AsNoTracking()
                .Include(ed => ed.REpisodeM)
                    .ThenInclude(e => e.RImagesM)
                .Include(ed => ed.REpisodeM)
                    .ThenInclude(e => e.RSeasonM)
                        .ThenInclude(s => s.RSeriesM)
                            .ThenInclude(ser => ser.RImagesM)
                .Where(ed => (userId == Guid.Empty || ed.RUserId == userId) && !ed.REpisodeM.IsDeleted)
                .OrderByDescending(ed => ed.LastWatchedAt)
                .ToListAsync();

            var list = new List<WatchingMoviesRes>();

            // Mappatura film
            foreach (var item in watchingMovies)
            {
                var stopped = (int)(item.StoppedAtSeconds ?? 0);
                var rawDuration = item.RMoviesM.Duration ?? 0;
                var totMin = rawDuration > 300 ? rawDuration / 60 : rawDuration;
                var stoppedMin = stopped / 60;
                var minuteLeft = Math.Max(0, totMin - stoppedMin);
                var progress = totMin > 0 ? (int)Math.Clamp(Math.Round((double)stoppedMin / totMin * 100), 0, 100) : 0;

                list.Add(new WatchingMoviesRes
                {
                    Id = item.RMoviesM.Id,
                    Title = item.RMoviesM.Title,
                    Icon = FormatUrl(item.RMoviesM.RImagesM?.Path),
                    TotMinute = totMin,
                    MinuteLeft = minuteLeft,
                    Progress = progress,
                    StoppedAtSeconds = stopped,
                    LastWatchedAt = item.LastWatchedAt,
                    MediaType = "movie"
                });
            }

            // Mappatura serie ed episodi
            foreach (var item in watchingEpisodes)
            {
                var stopped = item.StoppedAtSeconds ?? 0;
                var rawDuration = item.REpisodeM.Duration ?? 0;
                var totMin = rawDuration > 300 ? rawDuration / 60 : rawDuration;
                var stoppedMin = stopped / 60;
                var minuteLeft = Math.Max(0, totMin - stoppedMin);
                var progress = totMin > 0 ? (int)Math.Clamp(Math.Round((double)stoppedMin / totMin * 100), 0, 100) : 0;

                var icon = FormatUrl(item.REpisodeM.RImagesM?.Path
                           ?? item.REpisodeM.RSeasonM?.RSeriesM?.RImagesM?.Path);

                var seriesTitle = item.REpisodeM.RSeasonM?.RSeriesM?.Title ?? item.REpisodeM.Title;

                list.Add(new WatchingMoviesRes
                {
                    Id = item.REpisodeM.Id,
                    Title = seriesTitle,
                    Icon = icon,
                    TotMinute = totMin,
                    MinuteLeft = minuteLeft,
                    Progress = progress,
                    StoppedAtSeconds = stopped,
                    LastWatchedAt = item.LastWatchedAt,
                    Season = item.REpisodeM.RSeasonM?.SeasonNumber,
                    Episode = item.REpisodeM.EpisodeNumber,
                    EpName = item.REpisodeM.Title,
                    MediaType = "episode"
                });
            }

            var result = list
                .OrderByDescending(x => x.LastWatchedAt ?? DateTime.MinValue)
                .ToList();

            if (result.Count == 0)
                result = null;

            return Ok(result);
        }

        [HttpGet("films")]
        [HttpGet("movies")]
        public async Task<ActionResult<List<MovieCardRes>>> GetFilms()
        {
            var movies = await _db.MoviesMs
                .AsNoTracking()
                .Include(m => m.RImagesM)
                .Include(m => m.TagsDs)
                    .ThenInclude(td => td.RTagM)
                .Where(m => !m.IsDeleted)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            var list = movies.Select(m => new MovieCardRes
            {
                Id = m.Id,
                Title = m.Title,
                Icon = FormatUrl(m.RImagesM?.Path),
                Description = m.Description,
                Duration = m.Duration,
                ReleaseYear = m.CreatedAt.Year,
                ViewCount = m.ViewCount,
                Tags = m.TagsDs
                    .Where(td => td.RTagM != null)
                    .Select(td => td.RTagM.Name)
                    .ToList()
            }).ToList();

            if (list.Count == 0)
                list = null;

            return Ok(list);
        }

        [HttpGet("series")]
        [HttpGet("tv-series")]
        public async Task<ActionResult<List<SeriesCardRes>>> GetSeries()
        {
            var seriesList = await _db.SeriesMs
                .AsNoTracking()
                .Include(s => s.RImagesM)
                .Include(s => s.SeasonsMs)
                .Include(s => s.TagsDs)
                    .ThenInclude(td => td.RTagM)
                .Where(s => !s.IsDeleted)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var list = seriesList.Select(s => new SeriesCardRes
            {
                Id = s.Id,
                Title = s.Title,
                Icon = FormatUrl(s.RImagesM?.Path),
                Description = s.Description,
                SeasonsCount = s.SeasonsMs.Count,
                ReleaseYear = s.ReleaseYear,
                Rating = s.Rating,
                Tags = s.TagsDs
                    .Where(td => td.RTagM != null)
                    .Select(td => td.RTagM.Name)
                    .ToList()
            }).ToList();

            if (list.Count == 0)
                list = null;

            return Ok(list);
        }

        [HttpGet("series/{id}")]
        public async Task<ActionResult<SeriesDetailRes>> GetSeriesDetail(Guid id)
        {
            var s = await _db.SeriesMs
                .AsNoTracking()
                .Include(s => s.RImagesM)
                .Include(s => s.TagsDs)
                    .ThenInclude(td => td.RTagM)
                .Include(s => s.SeasonsMs)
                    .ThenInclude(sea => sea.EpisodesMs)
                        .ThenInclude(ep => ep.RImagesM)
                .Where(s => s.Id == id && !s.IsDeleted)
                .FirstOrDefaultAsync();

            if (s == null)
                return NotFound(new { message = "Serie non trovata." });

            var res = new SeriesDetailRes
            {
                Id = s.Id,
                Title = s.Title,
                Icon = FormatUrl(s.RImagesM?.Path),
                Description = s.Description,
                SeasonsCount = s.SeasonsMs.Count,
                ReleaseYear = s.ReleaseYear,
                Rating = s.Rating,
                Tags = s.TagsDs
                    .Where(td => td.RTagM != null)
                    .Select(td => td.RTagM.Name)
                    .ToList(),
                Seasons = s.SeasonsMs
                    .OrderBy(sea => sea.SeasonNumber)
                    .Select(sea => new SeasonDetailRes
                    {
                        Id = sea.Id,
                        SeasonNumber = sea.SeasonNumber,
                        Title = sea.Title,
                        EpisodesCount = sea.EpisodesMs.Count(e => !e.IsDeleted),
                        Episodes = sea.EpisodesMs
                            .Where(e => !e.IsDeleted)
                            .OrderBy(e => e.EpisodeNumber)
                            .Select(e => new EpisodeDetailRes
                            {
                                Id = e.Id,
                                EpisodeNumber = e.EpisodeNumber,
                                Title = e.Title,
                                Description = e.Description,
                                Duration = e.Duration,
                                Path = FormatUrl(e.Path),
                                Icon = FormatUrl(e.RImagesM?.Path)
                            }).ToList()
                    }).ToList()
            };

            return Ok(res);
        }

        [HttpGet("episodes/{id}")]
        public async Task<ActionResult<EpisodeDetailRes>> GetEpisodeById(Guid id)
        {
            var ep = await _db.EpisodesMs
                .AsNoTracking()
                .Include(e => e.RImagesM)
                .Where(e => e.Id == id && !e.IsDeleted)
                .FirstOrDefaultAsync();

            if (ep == null)
                return NotFound(new { message = "Episodio non trovato." });

            var res = new EpisodeDetailRes
            {
                Id = ep.Id,
                EpisodeNumber = ep.EpisodeNumber,
                Title = ep.Title,
                Description = ep.Description,
                Duration = ep.Duration,
                Path = FormatUrl(ep.Path),
                Icon = FormatUrl(ep.RImagesM?.Path)
            };

            return Ok(res);
        }

        private string FormatUrl(string? path)
        {
            if (string.IsNullOrWhiteSpace(path)) return string.Empty;
            if (path.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || path.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                return path;
            return $"{Request.Scheme}://{Request.Host}{path}";
        }
    }
}
