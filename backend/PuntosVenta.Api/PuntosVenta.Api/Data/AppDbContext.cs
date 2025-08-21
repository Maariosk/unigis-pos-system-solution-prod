using Microsoft.EntityFrameworkCore;
using PuntosVenta.Api.Data.Configurations;
using PuntosVenta.Api.Domain;

namespace PuntosVenta.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<PointOfSale> Points => Set<PointOfSale>();
    public DbSet<SalesByZone> SalesByZone => Set<SalesByZone>();
    public DbSet<AppUser> Users => Set<AppUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new PointOfSaleConfiguration());
        modelBuilder.ApplyConfiguration(new AppUserConfiguration());

        // Resultado de SP (no tabla)
        modelBuilder.Entity<SalesByZone>()
            .HasNoKey()
            .ToView(null);

        base.OnModelCreating(modelBuilder);
    }
}
