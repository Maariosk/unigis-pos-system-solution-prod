USE [$(DB_NAME)];
GO
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_SalesByZone
AS
BEGIN
    SET NOCOUNT ON;
    SELECT [Zone] AS Zone, SUM(Sale) AS TotalSale
      FROM dbo.PointOfSale
     GROUP BY [Zone]
     ORDER BY Zone;
END
GO
