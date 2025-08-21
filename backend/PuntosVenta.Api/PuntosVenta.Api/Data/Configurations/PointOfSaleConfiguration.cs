using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PuntosVenta.Api.Domain;

namespace PuntosVenta.Api.Data.Configurations;

public class PointOfSaleConfiguration : IEntityTypeConfiguration<PointOfSale>
{
    public void Configure(EntityTypeBuilder<PointOfSale> b)
    {
        b.ToTable("PointOfSale");
        b.HasKey(x => x.Id);

        b.Property(x => x.Latitude).HasColumnType("decimal(9,6)").IsRequired();
        b.Property(x => x.Longitude).HasColumnType("decimal(9,6)").IsRequired();
        b.Property(x => x.Sale).HasColumnType("decimal(18,2)").IsRequired();

        b.Property(x => x.Description).HasMaxLength(200).IsRequired();
        b.Property(x => x.Zone).HasMaxLength(100).IsRequired();
        b.Property(x => x.CreatedAt).IsRequired();
    }
}
