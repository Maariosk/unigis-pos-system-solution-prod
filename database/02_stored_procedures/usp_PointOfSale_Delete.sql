SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_PointOfSale_Delete
  Propósito  : Elimina un registro de dbo.PointOfSale por Id, con validaciones y manejo
               de errores. Devuelve la cantidad de filas afectadas.
  Tabla      : dbo.PointOfSale (Id, Latitude, Longitude, Description, Sale, Zone,
                                CreatedAt, UpdatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creación con validaciones, bloqueo UPDLOCK/HOLDLOCK,
                              TRY/CATCH y retorno de RowsAffected.
========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_PointOfSale_Delete
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        -- Validaciones básicas
        IF @Id IS NULL OR @Id <= 0
            THROW 50001, 'Id inválido. Debe ser un entero positivo.', 1;

        BEGIN TRAN;

        -- Verificar existencia y bloquear la fila objetivo para evitar carreras
        IF NOT EXISTS (SELECT 1 FROM dbo.PointOfSale WITH (UPDLOCK, HOLDLOCK) WHERE Id = @Id)
            THROW 50002, 'Registro no encontrado en PointOfSale.', 1;

        DELETE FROM dbo.PointOfSale
        WHERE Id = @Id;

        DECLARE @RowsAffected INT = @@ROWCOUNT;

        COMMIT;

        -- Respuesta estándar
        SELECT @RowsAffected AS RowsAffected, @Id AS DeletedId;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK;

        DECLARE @ErrNum INT = ERROR_NUMBER();
        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();

        -- Mensaje más claro si hay violación de FK (error 547)
        IF @ErrNum = 547
        BEGIN
            DECLARE @Friendly NVARCHAR(2048) =
                N'No es posible eliminar el registro porque está referenciado por otros datos.';
            THROW 50090, @Friendly, 1;
        END

        -- Repropagar con contexto del procedimiento (evitar CONCAT por compatibilidad)
        DECLARE @Msg NVARCHAR(2048) = N'usp_PointOfSale_Delete: ' + ISNULL(@ErrMsg, N'');
        THROW 50999, @Msg, 1;
    END CATCH
END
GO
