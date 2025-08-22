SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_AppUser_SetPasswordHash
  Prop�sito  : Actualiza el PasswordHash de un usuario
               - Valida entradas.
  Tabla      : dbo.AppUser (Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creaci�n con validaciones, bloqueo UPDLOCK/HOLDLOCK

  Notas      :
    - Recomendado �ndice �nico sobre UserName:
        CREATE UNIQUE INDEX UX_AppUser_UserName ON dbo.AppUser(UserName);
========================================================================================
*/
CREATE OR ALTER PROC dbo.usp_AppUser_SetPasswordHash
  @UserName     nvarchar(256),
  @PasswordHash nvarchar(max)
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    -- Normalizaci�n
    SET @UserName = LTRIM(RTRIM(@UserName));

    -- Validaciones
    IF @UserName IS NULL OR @UserName = N''
      THROW 50001, 'El nombre de usuario es requerido.', 1;

    IF @PasswordHash IS NULL OR @PasswordHash = N''
      THROW 50002, 'La contrase�a (hash) es requerida.', 1;

    IF LEN(@UserName) > 256
      THROW 50003, 'UserName excede la longitud m�xima (256).', 1;

    -- Tomar la fila con bloqueo para actualizaci�n
    DECLARE @UserId int;
    SELECT @UserId = u.Id
    FROM dbo.AppUser AS u WITH (UPDLOCK, HOLDLOCK)
    WHERE u.UserName = @UserName;

    IF @UserId IS NULL
      THROW 50006, 'Usuario no encontrado.', 1;

    -- Si el hash ya es el mismo, no actualizamos (evita escrituras innecesarias)
    IF EXISTS (
      SELECT 1
      FROM dbo.AppUser
      WHERE Id = @UserId
        AND ISNULL(PasswordHash, N'') = @PasswordHash
    )
    BEGIN
      SELECT CAST(0 AS int) AS RowsAffected, @UserId AS UserId;
      RETURN;
    END

    -- Actualizaci�n
    UPDATE dbo.AppUser
       SET PasswordHash = @PasswordHash
     WHERE Id = @UserId;

    SELECT @@ROWCOUNT AS RowsAffected, @UserId AS UserId;
  END TRY
  BEGIN CATCH
    DECLARE @ErrMsg nvarchar(4000) = ERROR_MESSAGE();
    DECLARE @Msg    nvarchar(2048) = N'usp_AppUser_SetPasswordHash: ' + ISNULL(@ErrMsg, N'');
    THROW 50999, @Msg, 1;
  END CATCH
END
GO
