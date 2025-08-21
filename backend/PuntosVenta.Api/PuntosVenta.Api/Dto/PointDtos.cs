namespace PuntosVenta.Api.Dto;

public record CreatePointDto(
    decimal Latitude,
    decimal Longitude,
    string Description,
    decimal Sale,
    string Zone
);

public record UpdatePointDto(
    decimal Latitude,
    decimal Longitude,
    string Description,
    decimal Sale,
    string Zone
);

public record PointDto(
    int Id,
    decimal Latitude,
    decimal Longitude,
    string Description,
    decimal Sale,
    string Zone,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record SalesByZoneDto(string Zone, decimal TotalSale);
