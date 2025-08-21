-- Obtener usuario por nombre
CREATE OR ALTER PROC dbo.usp_AppUser_GetByUsername
  @UserName nvarchar(256)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP(1) Id, UserName, PasswordHash, Zone, IsAdmin
  FROM dbo.AppUser
  WHERE UserName = @UserName;
END
GO

-- Insertar usuario (recibe PasswordHash ya calculado en backend)
CREATE OR ALTER PROC dbo.usp_AppUser_Insert
  @UserName nvarchar(256),
  @PasswordHash nvarchar(max),
  @Zone nvarchar(100) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  IF EXISTS(SELECT 1 FROM dbo.AppUser WHERE UserName = @UserName)
  BEGIN
    RAISERROR('El usuario ya existe.', 16, 1);
    RETURN;
  END

  INSERT INTO dbo.AppUser(UserName, PasswordHash, Zone, IsAdmin)
  VALUES(@UserName, @PasswordHash, @Zone, 1);
END
GO

-- (Opcional) Actualizar hash de contraseña (para reset/admin)
CREATE OR ALTER PROC dbo.usp_AppUser_SetPasswordHash
  @UserName nvarchar(256),
  @PasswordHash nvarchar(max)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.AppUser
  SET PasswordHash = @PasswordHash
  WHERE UserName = @UserName;
END
GO

-- Asegura que admin está activo
UPDATE dbo.AppUser SET IsAdmin = 1, Zone = COALESCE(Zone, 'Naucalpan')
WHERE UserName = 'admin';
