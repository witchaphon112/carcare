using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace carwash.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddQueueStatusToQueue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "QueueStatus",
                table: "Queues",
                type: "int",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QueueStatus",
                table: "Queues");
        }
    }
}
