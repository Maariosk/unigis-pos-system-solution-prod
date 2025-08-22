SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_AppUser_GetByUserName
  Propósito  : Obtiene un usuario por su UserName (búsqueda exacta).
               - Normaliza (TRIM) y valida el parámetro.
               - Devuelve: Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt.

  Tabla      : dbo.AppUser (Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creación con validaciones, manejo de errores y notas.
  Notas      :
    - Se recomienda índice único para garantizar unicidad por UserName:
        CREATE UNIQUE INDEX UX_AppUser_UserName ON dbo.AppUser(UserName);
========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_AppUser_GetByUserName
  @UserName NVARCHAR(256)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    -- Normalización
    SET @UserName = LTRIM(RTRIM(@UserName));

    -- Validaciones
    IF @UserName IS NULL OR @UserName = N''
      THROW 61001, 'UserName es requerido.', 1;

    IF LEN(@UserName) > 256
      THROW 61002, 'UserName excede la longitud máxima (256).', 1;

    -- Consulta (se asume colación CI en la columna para insensibilidad a mayúsculas)
    SELECT TOP (1)
           Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt
      FROM dbo.AppUser
     WHERE UserName = @UserName;
  END TRY
  BEGIN CATCH
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @Msg    NVARCHAR(2048) = N'usp_AppUser_GetByUserName: ' + ISNULL(@ErrMsg, N'');
    -- Re-lanza con código de error propio y mensaje contextual
    THROW 61999, @Msg, 1;
  END CATCH
END
GO
