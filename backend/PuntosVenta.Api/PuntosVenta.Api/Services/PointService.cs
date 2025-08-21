using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using PuntosVenta.Api.Data;
using PuntosVenta.Api.Domain;

namespace PuntosVenta.Api.Services;

public class PointService : IPointService
{
    private readonly AppDbContext _db;
    public PointService(AppDbContext db) => _db = db;

    public async Task<int> CreateAsync(PointOfSale p, CancellationToken ct = default)
    {
        var newId = new SqlParameter("@NewId", System.Data.SqlDbType.Int)
        { Direction = System.Data.ParameterDirection.Output };

        await _db.Database.ExecuteSqlInterpolatedAsync($@"
            EXEC dbo.usp_PointOfSale_Create
                 @Latitude={p.Latitude},
                 @Longitude={p.Longitude},
                 @Description={p.Description},
                 @Sale={p.Sale},
                 @Zone={p.Zone},
                 @NewId={newId} OUTPUT", ct);

        return (int)(newId.Value ?? 0);
    }

    public Task UpdateAsync(PointOfSale p, CancellationToken ct = default) =>
        _db.Database.ExecuteSqlInterpolatedAsync($@"
            EXEC dbo.usp_PointOfSale_Update
                 @Id={p.Id},
                 @Latitude={p.Latitude},
                 @Longitude={p.Longitude},
                 @Description={p.Description},
                 @Sale={p.Sale},
                 @Zone={p.Zone}", ct);

    public Task DeleteAsync(int id, CancellationToken ct = default) =>
        _db.Database.ExecuteSqlInterpolatedAsync($@"EXEC dbo.usp_PointOfSale_Delete @Id={id}", ct);

    public async Task<PointOfSale?> GetAsync(int id, CancellationToken ct = default)
    {
        var rows = await _db.Points
            .FromSqlInterpolated($@"EXEC dbo.usp_PointOfSale_GetById @Id={id}")
            .AsNoTracking()
            .ToListAsync(ct);                 
        return rows.FirstOrDefault();         
    }

    public async Task<IReadOnlyList<PointOfSale>> ListAsync(int page, int size, CancellationToken ct = default) =>
        await _db.Points
            .FromSqlInterpolated($@"EXEC dbo.usp_PointOfSale_List @PageNumber={page}, @PageSize={size}")
            .AsNoTracking()
            .ToListAsync(ct);

    public async Task<IReadOnlyList<(string Zone, decimal TotalSale)>> SalesByZoneAsync(CancellationToken ct = default)
    {
        var rows = await _db.SalesByZone
            .FromSqlRaw("EXEC dbo.usp_PointOfSale_SalesByZone")
            .AsNoTracking()
            .ToListAsync(ct);

        return rows.Select(x => (x.Zone, x.TotalSale)).ToList();
    }
}
