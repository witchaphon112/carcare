using carwash.Application.Fureture.Line.Command;
using carwash.Migrations.Persistence;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
const string FrontendCorsPolicy = "FrontendCorsPolicy";

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.AddDbContext<CarWashDbContext>(options =>
    options.UseSqlServer(connectionString));
builder.Services.AddHttpClient<CreateLineRichMenuCommandHandler>();
builder.Services.AddHttpClient<UploadLineRichMenuImageCommandHandler>();
builder.Services.AddHttpClient<AssignLineRichMenuCommandHandler>();
builder.Services.AddHttpClient<ReplyLineMapCardCommandHandler>();
builder.Services.AddHttpClient<ReplyLineQueueCardCommandHandler>();
builder.Services.AddHttpClient<ReplyLineServiceImageCommandHandler>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedHost
});

app.UseCors(FrontendCorsPolicy);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(app.Environment.ContentRootPath, "Aseests", "Line")),
    RequestPath = "/line-assets"
});

app.MapControllers();

app.Run();
