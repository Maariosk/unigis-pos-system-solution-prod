SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_PointOfSale_SalesByZone
  Prop�sito  : Agrega el total de ventas por zona a partir de dbo.PointOfSale.
               - Normaliza Zone (TRIM) y agrupa nulos/vac�os como '(Sin zona)'.
               - Suma de manera segura en DECIMAL(38,2).
               - Ordena alfab�ticamente por Zone para estabilidad.

  Tabla      : dbo.PointOfSale (Id, Latitude, Longitude, Description, Sale, Zone,
                                CreatedAt, UpdatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creaci�n con normalizaci�n de Zone, manejo de nulos
                             y suma con precisi�n ampliada.

  Notas      :
    - Si la UI necesita porcentajes, calc�lalos en app usando el total agregado.
========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_SalesByZone
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        /* Normaliza Zone (TRIM) & agrupa nulos/vac�os con etiqueta est�ndar */
        SELECT
            Zone = ISNULL(Z.ZoneNorm, N'(Sin zona)'),
            TotalSale = SUM(CAST(ISNULL(P.Sale, 0) AS DECIMAL(38,2)))
        FROM dbo.PointOfSale AS P
        CROSS APPLY (SELECT NULLIF(LTRIM(RTRIM(P.[Zone])), N'') AS ZoneNorm) AS Z
        GROUP BY ISNULL(Z.ZoneNorm, N'(Sin zona)')
        ORDER BY Zone;  -- orden alfab�tico estable
    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        -- Repropaga con contexto del procedimiento (sin CONCAT por compatibilidad amplia)
        DECLARE @Msg NVARCHAR(2048) = N'usp_PointOfSale_SalesByZone: ' + ISNULL(@ErrMsg, N'');
        THROW 50999, @Msg, 1;
    END CATCH
END
GO
