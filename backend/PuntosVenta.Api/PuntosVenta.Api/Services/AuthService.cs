using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Identity; // PasswordHasher
using Microsoft.Extensions.Configuration;
using PuntosVenta.Api.Dto;

namespace PuntosVenta.Api.Services;

public sealed class AuthService : IAuthService
{
    private readonly string _cs;
    private readonly PasswordHasher<object> _hasher = new();

    public AuthService(IConfiguration cfg)
    {
        _cs = cfg.GetConnectionString("DefaultConnection")
              ?? throw new InvalidOperationException("Connection string 'DefaultConnection' missing.");
    }

    public async Task<AuthUserDto?> LoginAsync(string username, string password, CancellationToken ct)
    {
        int id = 0; string? userName = null, zone = null, passwordHash = null; bool isActive = false;

        await using (var conn = new SqlConnection(_cs))
        {
            await conn.OpenAsync(ct);

            using var cmd = new SqlCommand("dbo.usp_AppUser_GetByUsername", conn)
            { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@UserName", username);

            using var rdr = await cmd.ExecuteReaderAsync(ct);
            if (await rdr.ReadAsync(ct))
            {
                id = rdr.GetInt32(rdr.GetOrdinal("Id"));
                userName = rdr.GetString(rdr.GetOrdinal("UserName"));
                zone = rdr.IsDBNull(rdr.GetOrdinal("Zone")) ? null : rdr.GetString(rdr.GetOrdinal("Zone"));
                isActive = rdr.GetBoolean(rdr.GetOrdinal("IsAdmin"));
                passwordHash = rdr.IsDBNull(rdr.GetOrdinal("PasswordHash")) ? null : rdr.GetString(rdr.GetOrdinal("PasswordHash"));
            }
        }

        if (userName is null || !isActive || string.IsNullOrEmpty(passwordHash))
            return null;

        var result = _hasher.VerifyHashedPassword(null, passwordHash!, password);
        if (result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            return new AuthUserDto
            {
                Id = id,
                Username = userName!,
                DisplayName = userName!, 
                Zone = zone ?? "Naucalpan"
            };
        }

        return null;
    }

    public async Task<(bool ok, string? message)> RegisterAsync(AuthRegisterDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
            return (false, "La contraseña debe tener al menos 8 caracteres.");

        var hash = _hasher.HashPassword(null, dto.Password);

        await using var conn = new SqlConnection(_cs);
        await conn.OpenAsync(ct);

        using var cmd = new SqlCommand("dbo.usp_AppUser_Insert", conn)
        { CommandType = CommandType.StoredProcedure };

        cmd.Parameters.AddWithValue("@UserName", dto.Username);
        cmd.Parameters.AddWithValue("@PasswordHash", hash);
        cmd.Parameters.AddWithValue("@Zone", (object?)dto.Zone ?? DBNull.Value);

        try
        {
            await cmd.ExecuteNonQueryAsync(ct);
            return (true, null);
        }
        catch (SqlException ex)
        {
            return (false, ex.Message);
        }
    }

    public async Task<bool> SetPasswordAsync(string username, string newPassword, CancellationToken ct)
    {
        var hash = _hasher.HashPassword(null, newPassword);

        await using var conn = new SqlConnection(_cs);
        await conn.OpenAsync(ct);

        using var cmd = new SqlCommand("dbo.usp_AppUser_SetPasswordHash", conn)
        { CommandType = CommandType.StoredProcedure };
        cmd.Parameters.AddWithValue("@UserName", username);
        cmd.Parameters.AddWithValue("@PasswordHash", hash);

        var rows = await cmd.ExecuteNonQueryAsync(ct);
        return rows > 0;
    }
}
