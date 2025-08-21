using Microsoft.AspNetCore.Mvc;
using PuntosVenta.Api.Dto;
using PuntosVenta.Api.Services;

namespace PuntosVenta.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthLoginDto req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            return Ok(new { success = false, message = "Usuario y contraseña requeridos." });

        var user = await _auth.LoginAsync(req.Username, req.Password, ct);
        if (user is null)
            return Ok(new { success = false, message = "Usuario o contraseña inválidos." });

        return Ok(new { success = true, user });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AuthRegisterDto req, CancellationToken ct)
    {
        (bool ok, string? msg) = await _auth.RegisterAsync(req, ct);
        return Ok(new { success = ok, message = msg });
    }
}
