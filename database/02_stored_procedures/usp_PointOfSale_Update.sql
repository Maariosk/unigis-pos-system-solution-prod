SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_PointOfSale_Update
  Propósito  : Actualiza un registro de dbo.PointOfSale.
               - Valida parámetros (rangos/longitudes, requeridos).
               - Normaliza textos (TRIM) y no permite vacíos en Description/Zone.
               - Sólo escribe si hay cambios reales; setea UpdatedAt en hora CDMX.

  Tabla      : dbo.PointOfSale (Id, Latitude, Longitude, Description, Sale, Zone,
                                CreatedAt, UpdatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creación con validaciones, control transaccional,
                             hora local CDMX y actualización condicional.

  Notas      :
    - Hora CDMX calculada desde UTC y almacenada como datetime2(3) sin offset.
========================================================================================
*/
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
    SET XACT_ABORT ON;

    BEGIN TRY
        /* -------- Normalización -------- */
        SET @Description = NULLIF(LTRIM(RTRIM(@Description)), N'');
        SET @Zone        = NULLIF(LTRIM(RTRIM(@Zone)), N'');

        /* -------- Validaciones -------- */
        IF @Id IS NULL OR @Id <= 0
            THROW 50001, 'Id inválido.', 1;

        IF @Latitude < -90 OR @Latitude > 90
            THROW 50002, 'Latitude fuera de rango (-90 a 90).', 1;

        IF @Longitude < -180 OR @Longitude > 180
            THROW 50003, 'Longitude fuera de rango (-180 a 180).', 1;

        IF @Sale IS NULL OR @Sale < 0
            THROW 50004, 'Sale inválido (debe ser >= 0).', 1;

        IF @Description IS NULL
            THROW 50005, 'Description es requerido.', 1;

        IF @Zone IS NULL
            THROW 50006, 'Zone es requerido.', 1;

        /* Hora local CDMX (datetime2 local, sin offset) */
        DECLARE @NowCdmx DATETIME2(3) =
            CAST( (SYSUTCDATETIME() AT TIME ZONE 'UTC')
                    AT TIME ZONE 'Central Standard Time (Mexico)' AS DATETIME2(3) );

        /* -------- Transacción -------- */
        BEGIN TRAN;

        -- Bloqueo optimista para existencia del registro
        IF NOT EXISTS (SELECT 1 FROM dbo.PointOfSale WITH (UPDLOCK, HOLDLOCK) WHERE Id = @Id)
            THROW 50020, 'El Id especificado no existe en PointOfSale.', 1;

        -- Actualizar sólo si hay cambios reales
        IF EXISTS (
            SELECT 1
            FROM dbo.PointOfSale p
            WHERE p.Id = @Id
              AND (
                     ISNULL(p.Latitude, 0)          <> @Latitude
                  OR ISNULL(p.Longitude, 0)         <> @Longitude
                  OR ISNULL(p.[Description], N'')   <> @Description
                  OR ISNULL(p.Sale, 0)              <> @Sale
                  OR ISNULL(p.[Zone], N'')          <> @Zone
                 )
        )
        BEGIN
            UPDATE dbo.PointOfSale
               SET Latitude      = @Latitude,
                   Longitude     = @Longitude,
                   [Description] = @Description,
                   Sale          = @Sale,
                   [Zone]        = @Zone,
                   UpdatedAt     = @NowCdmx
             WHERE Id = @Id;
        END

        COMMIT;

        -- Devuelve el registro (actualizado o sin cambios)
        SELECT TOP (1)
               Id, Latitude, Longitude, [Description], Sale, [Zone], CreatedAt, UpdatedAt
          FROM dbo.PointOfSale
         WHERE Id = @Id;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        -- Sin CONCAT para compatibilidad amplia
        DECLARE @Msg NVARCHAR(2048) = N'usp_PointOfSale_Update: ' + ISNULL(@ErrMsg, N'');
        THROW 50999, @Msg, 1;
    END CATCH
END
GO
