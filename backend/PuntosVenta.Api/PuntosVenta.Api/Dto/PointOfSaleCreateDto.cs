namespace PuntosVenta.Api.Dto
{
    public class PointOfSaleCreateDto
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Sale { get; set; }
        public string Zone { get; set; } = string.Empty;
    }
}
