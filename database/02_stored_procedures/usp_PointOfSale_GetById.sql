SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_PointOfSale_GetById
  Propósito  : Obtiene un registro de dbo.PointOfSale por su Id.
               - Devuelve 0 filas si no existe (comportamiento por defecto).
               - Opcionalmente puede lanzar error si no existe (@ThrowIfNotFound = 1).

  Tabla      : dbo.PointOfSale (Id, Latitude, Longitude, Description, Sale, Zone,
                                CreatedAt, UpdatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creación con validaciones, manejo de errores y
                              opción @ThrowIfNotFound.

========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_GetById
    @Id               INT,
    @ThrowIfNotFound  BIT = 0  -- 0 = devuelve 0 filas si no existe; 1 = lanza error
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        -- Validaciones
        IF @Id IS NULL OR @Id <= 0
            THROW 50001, 'Id inválido. Debe ser un entero positivo.', 1;

        -- Lectura
        SELECT
            Id,
            Latitude,
            Longitude,
            [Description],
            Sale,
            [Zone],
            CreatedAt,
            UpdatedAt
        FROM dbo.PointOfSale
        WHERE Id = @Id;

        -- Si se requiere lanzar error cuando no existe
        IF @ThrowIfNotFound = 1 AND @@ROWCOUNT = 0
            THROW 50002, 'Registro no encontrado en PointOfSale.', 1;
    END TRY
    BEGIN CATCH
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrNum INT = ERROR_NUMBER();
        DECLARE @ErrSta INT = ERROR_STATE();

        -- Repropagar con contexto del procedimiento (evitar CONCAT para compatibilidad)
        DECLARE @Msg NVARCHAR(2048) = N'usp_PointOfSale_GetById: ' + ISNULL(@ErrMsg, N'');
        THROW 50999, @Msg, 1;
    END CATCH
END
GO
