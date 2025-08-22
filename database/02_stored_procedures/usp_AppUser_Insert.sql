SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_AppUser_Insert
  Propósito  : Inserta un registro en dbo.AppUser con CreatedAt en horario CDMX.
               Valida entradas y evita duplicados por UserName.
  Tabla      : dbo.AppUser (Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt, UpdatedAt)

  Autor      : Mario C.
  Fecha      : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creación del procedimiento con validaciones,
                              TRY/CATCH y manejo de fecha local CDMX.
  Notas      :
    - Se recomienda tener un índice único sobre UserName para garantizar unicidad:
      CREATE UNIQUE INDEX UX_AppUser_UserName ON dbo.AppUser(UserName);
========================================================================================
*/
CREATE OR ALTER PROC dbo.usp_AppUser_Insert
  @UserName      nvarchar(256),
  @PasswordHash  nvarchar(max),
  @Zone          nvarchar(100) = NULL,
  @IsAdmin       bit = 1
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;

  BEGIN TRY
    /* Normalización básica */
    SET @UserName = LTRIM(RTRIM(@UserName));
    SET @Zone     = NULLIF(LTRIM(RTRIM(@Zone)), N'');

    /* Validaciones de requeridos */
    IF @UserName IS NULL OR @UserName = N''
      THROW 50001, 'El nombre de usuario es requerido.', 1;

    IF @PasswordHash IS NULL OR @PasswordHash = N''
      THROW 50002, 'La contraseña (hash) es requerida.', 1;

    /* Validaciones de longitud (coherentes con el esquema) */
    IF LEN(@UserName) > 256
      THROW 50003, 'UserName excede la longitud máxima (256).', 1;

    IF @Zone IS NOT NULL AND LEN(@Zone) > 100
      THROW 50004, 'Zone excede la longitud máxima (100).', 1;

    /* Evitar duplicados por UserName (bloqueo para concurrencia) */
    IF EXISTS (SELECT 1 FROM dbo.AppUser WITH (UPDLOCK, HOLDLOCK) WHERE UserName = @UserName)
      THROW 50005, 'El usuario ya existe.', 1;

    /* Fecha/hora actual en zona horaria CDMX (datetime2 local, sin offset) */
    DECLARE @Now_CDMX datetime2(3) =
      CAST( (SYSUTCDATETIME() AT TIME ZONE 'UTC') AT TIME ZONE 'Central Standard Time (Mexico)' AS datetime2(3) );

    /* Inserción */
    INSERT INTO dbo.AppUser (UserName, PasswordHash, Zone, IsAdmin, CreatedAt)
    VALUES (@UserName, @PasswordHash, @Zone, @IsAdmin, @Now_CDMX);

    /* (Opcional) devolver el nuevo Id; no cambia la firma del SP */
    SELECT CAST(SCOPE_IDENTITY() AS int) AS NewId;
  END TRY
  BEGIN CATCH
    /* Propagar error con contexto (sin CONCAT) */
    DECLARE @ErrMsg nvarchar(4000) = ERROR_MESSAGE();
    DECLARE @Msg    nvarchar(2048) = N'usp_AppUser_Insert: ' + ISNULL(@ErrMsg, N'');
    THROW 50999, @Msg, 1;
  END CATCH
END
GO
