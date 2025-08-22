/*
========================================================================================
  Nombre     : dbo.usp_PointOfSale_Create
  Propósito  : INSERT/UPDATE de PointOfSale.
               - Si @Id IS NULL  -> INSERT (setea CreatedAt).
               - Si @Id NOT NULL -> UPDATE (sólo si cambian datos; setea UpdatedAt).
  Tabla      : dbo.PointOfSale (Id, Latitude, Longitude, Description, Sale, Zone, CreatedAt, UpdatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Refactor para manejar upsert, manejo de errores/tx,
                             normalización de entradas y fechas en horario CDMX.
========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_Create
    @Id          INT              = NULL,         -- NULL = INSERT; con valor = UPDATE
    @Latitude    DECIMAL(9,6),
    @Longitude   DECIMAL(9,6),
    @Description NVARCHAR(200),
    @Sale        DECIMAL(18,2),
    @Zone        NVARCHAR(100),
    @NewId       INT              OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE
        @NowCdmx DATETIME2(3),
        @TzCdmx  SYSNAME = N'Central Standard Time (Mexico)';

    -- Hora local CDMX (considera DST)
    SET @NowCdmx =
        CAST( (SYSUTCDATETIME() AT TIME ZONE 'UTC') AT TIME ZONE @TzCdmx AS DATETIME2(3) );

    -- Normalización básica (trim -> NULL si queda vacío)
    SET @Description = NULLIF(LTRIM(RTRIM(@Description)), N'');
    SET @Zone        = NULLIF(LTRIM(RTRIM(@Zone)),        N'');

    -- Validaciones mínimas
    IF @Latitude  < -90  OR @Latitude  > 90   THROW 50010, 'Latitude fuera de rango (-90 a 90).', 1;
    IF @Longitude < -180 OR @Longitude > 180  THROW 50011, 'Longitude fuera de rango (-180 a 180).', 1;
    IF @Sale IS NULL OR @Sale < 0             THROW 50012, 'Sale inválido (debe ser >= 0).', 1;
    IF @Description IS NULL                   THROW 50013, 'Description es requerido.', 1;
    IF @Zone IS NULL                          THROW 50014, 'Zone es requerido.', 1;

    BEGIN TRY
        BEGIN TRAN;

        IF @Id IS NULL
        BEGIN
            -- ========= INSERT =========
            INSERT INTO dbo.PointOfSale
                (Latitude, Longitude, [Description], Sale, [Zone], CreatedAt, UpdatedAt)
            VALUES
                (@Latitude, @Longitude, @Description, @Sale, @Zone, @NowCdmx, NULL);

            SET @NewId = CONVERT(INT, SCOPE_IDENTITY());
        END
        ELSE
        BEGIN
            -- ========= UPDATE (sólo si hay cambios) =========
            IF NOT EXISTS (SELECT 1 FROM dbo.PointOfSale WITH (UPDLOCK, HOLDLOCK) WHERE Id = @Id)
                THROW 50020, 'El Id especificado no existe en PointOfSale.', 1;

            -- ¿Hay cambios?
            IF EXISTS (
                SELECT 1
                FROM dbo.PointOfSale p
                WHERE p.Id = @Id
                  AND (
                        ISNULL(p.Latitude,      0) <> @Latitude
                     OR ISNULL(p.Longitude,     0) <> @Longitude
                     OR ISNULL(p.[Description],N'') <> ISNULL(@Description,N'')
                     OR ISNULL(p.Sale,         0) <> @Sale
                     OR ISNULL(p.[Zone],       N'') <> ISNULL(@Zone,N'')
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

            SET @NewId = @Id;
        END

        COMMIT;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @Msg    NVARCHAR(2048) = N'usp_PointOfSale_Create: ' + LEFT(ISNULL(@ErrMsg, N''), 2000);
        -- Re-lanza con código propio; usa concatenación con + en lugar de CONCAT
        THROW 50099, @Msg, 1;
    END CATCH
END
GO
