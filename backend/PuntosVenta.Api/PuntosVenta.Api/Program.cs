using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PuntosVenta.Api.Data;
using PuntosVenta.Api.Domain;
using PuntosVenta.Api.Services;

var builder = WebApplication.CreateBuilder(args);
const string CorsPolicy = "CorsPolicy";

// DbContext
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Servicios
builder.Services.AddScoped<IPointService, PointService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();

// Web API base
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

/* ======================  CORS  ======================
 * En desarrollo: si no configuras orígenes, se permite todo.
 * En producción: define Cors:AllowedOrigins en appsettings o en App Settings.
 */
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
var allowCredentials = builder.Configuration.GetValue("Cors:AllowCredentials", false);

builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p =>
{
    if (allowedOrigins.Length > 0)
    {
        p.WithOrigins(allowedOrigins)
         .AllowAnyHeader()
         .AllowAnyMethod();

        if (allowCredentials)
            p.AllowCredentials();
    }
    else
    {
        // DEV: abre todo si no se configuró nada
        p.AllowAnyOrigin()
         .AllowAnyHeader()
         .AllowAnyMethod();
    }
}));

var app = builder.Build();

// Swagger en Dev o si Swagger:Enabled = true
var swaggerEnabled = app.Environment.IsDevelopment()
                     || app.Configuration.GetValue<bool>("Swagger:Enabled");
if (swaggerEnabled)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PuntosVenta API v1");
        c.RoutePrefix = "swagger";
    });
}

/* Respetar cabeceras de proxy (App Service) para esquemas/URLs correctas */
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseHttpsRedirection();

app.UseRouting();
app.UseCors(CorsPolicy);

// app.UseAuthentication();
// app.UseAuthorization();

app.MapControllers();

/* Migraciones automáticas */
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var pending = await db.Database.GetPendingMigrationsAsync();
    if (pending.Any())
        await db.Database.MigrateAsync();
    else
        await db.Database.EnsureCreatedAsync();
}

await app.RunAsync();