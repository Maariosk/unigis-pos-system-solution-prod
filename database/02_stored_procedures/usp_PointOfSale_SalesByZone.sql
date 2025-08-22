SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_PointOfSale_SalesByZone
  Propósito  : Agrega el total de ventas por zona a partir de dbo.PointOfSale.
               - Normaliza Zone (TRIM) y agrupa nulos/vacíos como '(Sin zona)'.
               - Suma de manera segura en DECIMAL(38,2).
               - Ordena alfabéticamente por Zone para estabilidad.

  Tabla      : dbo.PointOfSale (Id, Latitude, Longitude, Description, Sale, Zone,
                                CreatedAt, UpdatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creación con normalización de Zone, manejo de nulos
                             y suma con precisión ampliada.

  Notas      :
    - Si la UI necesita porcentajes, calcúlalos en app usando el total agregado.
========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_SalesByZone
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        /* Normaliza Zone (TRIM) & agrupa nulos/vacíos con etiqueta estándar */
        SELECT
            Zone = ISNULL(Z.ZoneNorm, N'(Sin zona)'),
            TotalSale = SUM(CAST(ISNULL(P.Sale, 0) AS DECIMAL(38,2)))
        FROM dbo.PointOfSale AS P
        CROSS APPLY (SELECT NULLIF(LTRIM(RTRIM(P.[Zone])), N'') AS ZoneNorm) AS Z
        GROUP BY ISNULL(Z.ZoneNorm, N'(Sin zona)')
        ORDER BY Zone;  -- orden alfabético estable
    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        -- Repropaga con contexto del procedimiento (sin CONCAT por compatibilidad amplia)
        DECLARE @Msg NVARCHAR(2048) = N'usp_PointOfSale_SalesByZone: ' + ISNULL(@ErrMsg, N'');
        THROW 50999, @Msg, 1;
    END CATCH
END
GO
