using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BTime.Api.Controllers.Dashboard;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    [HttpGet("dashMenu")]
    public IActionResult GetDashMenu()
    {
        // Moduli principali disponibili sul NAS
        var modules = new List<object>
        {
            new {
                id = 1,
                title = "File",
                name = "File",
                description = "Esplora, carica e organizza i tuoi documenti e cartelle virtuali",
                img = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80"
            },
            new {
                id = 2,
                title = "Photo",
                name = "Photo",
                description = "Galleria fotografica personale con anteprime veloci e metadati EXIF",
                img = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80"
            },
            new {
                id = 3,
                title = "Film",
                name = "Film",
                description = "Catalogo cinematografico e streaming video fluido stile Netflix",
                img = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80"
            },
        };
        return Ok(modules);
    }
}