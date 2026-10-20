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
                    HeroTitle = "Kaito Kiddo: The Last Thief",
                    Description = "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Eum soluta commodi ipsa ut officiis reprehenderit a repellat labore voluptate molestiae distinctio magni, non corrupti nostrum qui blanditiis illo sit error?",
                    Icon = "https://imgs.search.brave.com/Nt1z2ObBrGxK-9i_PJ6ioz7PbFpYm1yCo7tbltrIVV0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2M4LzA5/L2MzL2M4MDljM2Fh/MjI1N2I2ZTEwM2Zl/OGIzNzcwMWMwZDAw/LmpwZw",
                    Tags = ["4K HDR", "18+", "Sci-Fi", "Action"]
                });
            }

            var banner = new HeroBannerRes
            {
                HeroTitle = r.Title,
                Icon = r.RImagesM?.Path ?? string.Empty,
                Description = r.Description ?? string.Empty,
                Tags = [.. r.TagsDs
                    .Where(td => td.RTagM != null)
                    .Select(td => td.RTagM.Name)]
            };

            return Ok(banner);
        }
    }
}
