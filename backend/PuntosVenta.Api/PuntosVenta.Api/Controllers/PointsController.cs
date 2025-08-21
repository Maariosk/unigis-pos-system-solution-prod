using Microsoft.AspNetCore.Mvc;
using PuntosVenta.Api.Domain;
using PuntosVenta.Api.Dto;
using PuntosVenta.Api.Services;

namespace PuntosVenta.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PointsController : ControllerBase
{
    private readonly IPointService _svc;
    public PointsController(IPointService svc) => _svc = svc;

    // GET api/points?page=1&size=50
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PointDto>>> List([FromQuery] int page = 1, [FromQuery] int size = 50, CancellationToken ct = default)
    {
        page = page <= 0 ? 1 : page; size = size is > 0 and <= 500 ? size : 50;

        var list = await _svc.ListAsync(page, size, ct);
        var dto = list.Select(ToDto);
        return Ok(dto);
    }

    // GET api/points/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<PointDto>> Get(int id, CancellationToken ct = default)
    {
        var entity = await _svc.GetAsync(id, ct);
        return entity is null ? NotFound() : Ok(ToDto(entity));
    }

    // POST api/points
    [HttpPost]
    public async Task<ActionResult<PointDto>> Create([FromBody] CreatePointDto dto, CancellationToken ct = default)
    {
        var entity = ToEntity(dto);
        var id = await _svc.CreateAsync(entity, ct);
        var created = await _svc.GetAsync(id, ct);
        return CreatedAtAction(nameof(Get), new { id }, created is null ? null : ToDto(created));
    }

    // PUT api/points/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePointDto dto, CancellationToken ct = default)
    {
        var entity = ToEntity(dto); entity.Id = id;
        await _svc.UpdateAsync(entity, ct);
        return NoContent();
    }

    // DELETE api/points/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct = default)
    {
        await _svc.DeleteAsync(id, ct);
        return NoContent();
    }

    // GET api/points/sales-by-zone
    [HttpGet("sales-by-zone")]
    public async Task<ActionResult<IEnumerable<SalesByZoneDto>>> SalesByZone(CancellationToken ct = default)
    {
        var rows = await _svc.SalesByZoneAsync(ct);
        return Ok(rows.Select(x => new SalesByZoneDto(x.Zone, x.TotalSale)));
    }

    // -------- mapping helpers --------
    private static PointOfSale ToEntity(CreatePointDto d) => new()
    {
        Latitude = d.Latitude,
        Longitude = d.Longitude,
        Description = d.Description,
        Sale = d.Sale,
        Zone = d.Zone
    };
    private static PointOfSale ToEntity(UpdatePointDto d) => new()
    {
        Latitude = d.Latitude,
        Longitude = d.Longitude,
        Description = d.Description,
        Sale = d.Sale,
        Zone = d.Zone
    };
    private static PointDto ToDto(PointOfSale p) =>
        new(p.Id, p.Latitude, p.Longitude, p.Description, p.Sale, p.Zone, p.CreatedAt, p.UpdatedAt);
}
