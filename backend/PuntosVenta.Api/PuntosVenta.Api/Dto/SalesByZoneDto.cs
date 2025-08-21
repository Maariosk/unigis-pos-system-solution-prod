using Microsoft.EntityFrameworkCore;

namespace PuntosVenta.Api.Domain;

[Keyless] // no tiene PK; proviene de un SP
public class SalesByZone
{
    public string Zone { get; set; } = string.Empty;
    public decimal TotalSale { get; set; }
}
