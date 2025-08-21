USE [$(DB_NAME)];
GO
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_Update
    @Id           INT,
    @Latitude     DECIMAL(9,6),
    @Longitude    DECIMAL(9,6),
    @Description  NVARCHAR(200),
    @Sale         DECIMAL(18,2),
    @Zone         NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.PointOfSale
       SET Latitude = @Latitude,
           Longitude = @Longitude,
           [Description] = @Description,
           Sale = @Sale,
           [Zone] = @Zone,
           UpdatedAt = SYSUTCDATETIME()
     WHERE Id = @Id;
END
GO
