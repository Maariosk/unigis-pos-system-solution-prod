USE [$(DB_NAME)];
GO
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_List
    @PageNumber INT = 1,
    @PageSize   INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    ;WITH cte AS (
      SELECT *, ROW_NUMBER() OVER (ORDER BY Id DESC) AS rn
        FROM dbo.PointOfSale
    )
    SELECT *
      FROM cte
     WHERE rn BETWEEN ((@PageNumber-1)*@PageSize + 1) AND (@PageNumber*@PageSize)
     ORDER BY rn;
END
GO
