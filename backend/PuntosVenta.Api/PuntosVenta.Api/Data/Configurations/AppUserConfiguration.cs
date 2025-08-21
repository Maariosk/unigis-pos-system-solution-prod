using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PuntosVenta.Api.Domain;

namespace PuntosVenta.Api.Data.Configurations;

public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> b)
    {
        b.ToTable("AppUser");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.UserName).IsUnique();
        b.Property(x => x.UserName).HasMaxLength(80).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
        b.Property(x => x.Zone).HasMaxLength(120).IsRequired();
    }
}
