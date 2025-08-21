USE [$(DB_NAME)];
GO
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_Create
    @Latitude     DECIMAL(9,6),
    @Longitude    DECIMAL(9,6),
    @Description  NVARCHAR(200),
    @Sale         DECIMAL(18,2),
    @Zone         NVARCHAR(100),
    @NewId        INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.PointOfSale (Latitude, Longitude, [Description], Sale, [Zone])
    VALUES (@Latitude, @Longitude, @Description, @Sale, @Zone);
    SET @NewId = CONVERT(INT, SCOPE_IDENTITY());
END
GO
