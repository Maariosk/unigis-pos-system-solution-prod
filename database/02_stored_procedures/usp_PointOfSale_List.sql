SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_PointOfSale_List
  Propósito  : Lista registros paginados de dbo.PointOfSale.
               - Página y tamaño de página validados y acotados.
               - Orden determinístico (CreatedAt DESC, Id DESC).

  Tabla      : dbo.PointOfSale (Id, Latitude, Longitude, Description, Sale, Zone,
                                CreatedAt, UpdatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creación con validaciones, orden estable y TotalCount.
  Notas      :
    - Evita SELECT * y NOLOCK para lecturas más seguras.
========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_List
    @PageNumber INT = 1,
    @PageSize   INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        /* Normalización y límites razonables */
        IF @PageNumber IS NULL OR @PageNumber < 1 SET @PageNumber = 1;
        IF @PageSize   IS NULL OR @PageSize   < 1 SET @PageSize   = 50;
        IF @PageSize > 500 SET @PageSize = 500;  -- cota superior de seguridad

        DECLARE @FromRow INT = ((@PageNumber - 1) * @PageSize) + 1;
        DECLARE @ToRow   INT =  (@PageNumber     * @PageSize);

        ;WITH CTE AS
        (
            SELECT
                Id,
                Latitude,
                Longitude,
                [Description],
                Sale,
                [Zone],
                CreatedAt,
                UpdatedAt,
                rn = ROW_NUMBER() OVER (
                        ORDER BY
                            CreatedAt DESC,  -- primero por fecha de creación (nulos al final)
                            Id        DESC   -- desempate estable
                    )
            FROM dbo.PointOfSale
        )
        SELECT
            Id,
            Latitude,
            Longitude,
            [Description],
            Sale,
            [Zone],
            CreatedAt,
            UpdatedAt
        FROM CTE
        WHERE rn BETWEEN @FromRow AND @ToRow
        ORDER BY rn;

        /* Segundo resultset: total de filas (para UI de paginación) */
        SELECT COUNT_BIG(1) AS TotalCount
        FROM dbo.PointOfSale;
    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        -- Repropagar con contexto del procedimiento (sin CONCAT por compatibilidad)
        DECLARE @Msg NVARCHAR(2048) = N'usp_PointOfSale_List: ' + ISNULL(@ErrMsg, N'');
        THROW 50999, @Msg, 1;
    END CATCH
END
GO
