namespace PuntosVenta.Api.Dto;

public sealed class AuthLoginDto
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public sealed class AuthRegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty; // no requerido por DB actual
    public string Zone { get; set; } = "Naucalpan";
    public string Password { get; set; } = string.Empty;
}

public sealed class AuthUserDto
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Zone { get; set; } = "Naucalpan";
}

public sealed class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; } // nullable para permitir null
    public T? Data { get; set; }
}
