using PuntosVenta.Api.Dto;

namespace PuntosVenta.Api.Services;

public interface IAuthService
{
    // Login con parámetros simples
    Task<AuthUserDto?> LoginAsync(string username, string password, CancellationToken ct);

    // Registro: bool + mensaje opcional (nullable)
    Task<(bool ok, string? message)> RegisterAsync(AuthRegisterDto dto, CancellationToken ct);

    // (Opcional) Reset de contraseña
    Task<bool> SetPasswordAsync(string username, string newPassword, CancellationToken ct);
}
