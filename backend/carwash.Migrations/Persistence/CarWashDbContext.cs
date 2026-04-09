using carwash.Domain.Model;
using Microsoft.EntityFrameworkCore;

namespace carwash.Migrations.Persistence;

public sealed class CarWashDbContext(DbContextOptions<CarWashDbContext> options) : DbContext(options)
{
    public DbSet<Queue> Queues => Set<Queue>();
    public DbSet<MasterType> MasterTypes => Set<MasterType>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Queue>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.QueueId).HasMaxLength(50);
            entity.Property(x => x.QueueCar).HasMaxLength(200);
            entity.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<MasterType>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Value).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.HasIndex(x => x.Name).IsUnique();
        });
    }
}
