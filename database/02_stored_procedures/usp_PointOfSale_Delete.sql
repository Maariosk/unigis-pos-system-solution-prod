USE [$(DB_NAME)];
GO
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_Delete
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.PointOfSale WHERE Id = @Id;
END
GO
