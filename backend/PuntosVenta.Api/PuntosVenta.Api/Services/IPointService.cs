using PuntosVenta.Api.Domain;

namespace PuntosVenta.Api.Services;

public interface IPointService
{
    Task<int> CreateAsync(PointOfSale p, CancellationToken ct = default);
    Task UpdateAsync(PointOfSale p, CancellationToken ct = default);
    Task DeleteAsync(int id, CancellationToken ct = default);
    Task<PointOfSale?> GetAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<PointOfSale>> ListAsync(int page, int size, CancellationToken ct = default);
    Task<IReadOnlyList<(string Zone, decimal TotalSale)>> SalesByZoneAsync(CancellationToken ct = default);
}
