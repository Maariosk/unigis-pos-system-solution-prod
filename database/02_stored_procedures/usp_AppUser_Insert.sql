CREATE OR ALTER PROC dbo.usp_AppUser_Insert
  @UserName      nvarchar(256),
  @PasswordHash  nvarchar(max),
  @Zone          nvarchar(100) = NULL,
  @IsAdmin       bit = 1
AS
BEGIN
  SET NOCOUNT ON;

  -- Validaciones básicas
  IF @UserName IS NULL OR LTRIM(RTRIM(@UserName)) = ''
  BEGIN
    RAISERROR('El nombre de usuario es requerido.', 16, 1);
    RETURN;
  END

  IF EXISTS (SELECT 1 FROM dbo.AppUser WHERE UserName = @UserName)
  BEGIN
    RAISERROR('El usuario ya existe.', 16, 1);
    RETURN;
  END

  -- Fecha/hora actual en zona horaria CDMX (datetime2 local, sin offset)
  DECLARE @Now_CDMX datetime2(3) =
    CONVERT(datetime2(3), SYSDATETIMEOFFSET() AT TIME ZONE 'Central Standard Time (Mexico)');

  INSERT INTO dbo.AppUser (UserName, PasswordHash, Zone, IsAdmin, CreatedAt)
  VALUES (@UserName, @PasswordHash, @Zone, @IsAdmin, @Now_CDMX);
END