SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_AppUser_UpsertAdmin
  Propósito  : Garantiza la existencia de un usuario administrador y actualiza sus datos.
               - Si NO existe @UserName -> INSERT con IsAdmin = 1 y CreatedAt (hora CDMX).
               - Si SÍ existe          -> UPDATE de PasswordHash / Zone / IsAdmin.
               - (Opcional) elimina otros usuarios si @PruneOthers = 1 (por defecto NO).

  Tabla      : dbo.AppUser (Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Versión inicial con validaciones, normalización, transacción
                             y hora local CDMX. (No usa UpdatedAt)
  Notas      :
    - Recomendado índice único para UserName:
        CREATE UNIQUE INDEX UX_AppUser_UserName ON dbo.AppUser(UserName);
========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_AppUser_UpsertAdmin
    @UserName      NVARCHAR(256)  = N'admin',
    @PasswordHash  NVARCHAR(MAX),
    @Zone          NVARCHAR(100)  = N'Naucalpan',
    @PruneOthers   BIT            = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Normalización
    SET @UserName = LTRIM(RTRIM(@UserName));
    SET @Zone     = NULLIF(LTRIM(RTRIM(@Zone)), N'');

    -- Validaciones
    IF @UserName IS NULL OR @UserName = N''  THROW 60001, 'UserName es requerido.', 1;
    IF @PasswordHash IS NULL OR @PasswordHash = N''  THROW 60002, 'PasswordHash es requerido.', 1;
    IF LEN(@UserName) > 256  THROW 60003, 'UserName excede la longitud máxima (256).', 1;
    IF @Zone IS NOT NULL AND LEN(@Zone) > 100  THROW 60004, 'Zone excede la longitud máxima (100).', 1;

    -- Hora CDMX
    DECLARE @NowCdmx DATETIME2(3);
    BEGIN TRY
        SET @NowCdmx = CAST(
            (SYSUTCDATETIME() AT TIME ZONE 'UTC') AT TIME ZONE 'Central Standard Time (Mexico)'
            AS DATETIME2(3)
        );
    END TRY
    BEGIN CATCH
        SET @NowCdmx = SYSDATETIME();
    END CATCH

    BEGIN TRY
        BEGIN TRAN;

        DECLARE @AdminId INT;

        SELECT @AdminId = Id
          FROM dbo.AppUser WITH (UPDLOCK, HOLDLOCK)
         WHERE UserName = @UserName;

        IF @AdminId IS NULL
        BEGIN
            INSERT INTO dbo.AppUser (UserName, PasswordHash, Zone, IsAdmin, CreatedAt)
            VALUES (@UserName, @PasswordHash, @Zone, 1, @NowCdmx);

            SET @AdminId = CAST(SCOPE_IDENTITY() AS INT);
        END
        ELSE
        BEGIN
            UPDATE dbo.AppUser
               SET PasswordHash = @PasswordHash,
                   Zone         = @Zone,
                   IsAdmin      = 1
             WHERE Id = @AdminId;
        END

        IF @PruneOthers = 1
        BEGIN
            DELETE FROM dbo.AppUser
             WHERE Id <> @AdminId;
        END

        COMMIT;

        SELECT TOP (1) Id, UserName, Zone, IsAdmin, CreatedAt
          FROM dbo.AppUser
         WHERE Id = @AdminId;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK;

        DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @Msg NVARCHAR(2048) = N'usp_AppUser_UpsertAdmin: ' + ISNULL(@ErrMsg, N'');
        SET @Msg = LEFT(@Msg, 2047);  -- límite de THROW
        THROW 60999, @Msg, 1;
    END CATCH
END
GO
