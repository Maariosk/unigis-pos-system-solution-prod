SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_AppUser_GetByUserName
  Prop�sito  : Obtiene un usuario por su UserName (b�squeda exacta).
               - Normaliza (TRIM) y valida el par�metro.
               - Devuelve: Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt.

  Tabla      : dbo.AppUser (Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creaci�n con validaciones, manejo de errores y notas.
  Notas      :
    - Se recomienda �ndice �nico para garantizar unicidad por UserName:
        CREATE UNIQUE INDEX UX_AppUser_UserName ON dbo.AppUser(UserName);
========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_AppUser_GetByUserName
  @UserName NVARCHAR(256)
AS
BEGIN
  SET NOCOUNT ON;

  BEGIN TRY
    -- Normalizaci�n
    SET @UserName = LTRIM(RTRIM(@UserName));

    -- Validaciones
    IF @UserName IS NULL OR @UserName = N''
      THROW 61001, 'UserName es requerido.', 1;

    IF LEN(@UserName) > 256
      THROW 61002, 'UserName excede la longitud m�xima (256).', 1;

    -- Consulta (se asume colaci�n CI en la columna para insensibilidad a may�sculas)
    SELECT TOP (1)
           Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt
      FROM dbo.AppUser
     WHERE UserName = @UserName;
  END TRY
  BEGIN CATCH
    DECLARE @ErrMsg NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @Msg    NVARCHAR(2048) = N'usp_AppUser_GetByUserName: ' + ISNULL(@ErrMsg, N'');
    -- Re-lanza con c�digo de error propio y mensaje contextual
    THROW 61999, @Msg, 1;
  END CATCH
END
GO
