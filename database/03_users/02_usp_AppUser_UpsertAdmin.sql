CREATE OR ALTER PROCEDURE dbo.usp_AppUser_UpsertAdmin
  @UserName     NVARCHAR(80)  = N'admin',
  @PasswordHash NVARCHAR(500),
  @Zone         NVARCHAR(120) = N'Naucalpan'
AS
BEGIN
  SET NOCOUNT ON;

  IF EXISTS (SELECT 1 FROM dbo.AppUser WHERE UserName = @UserName)
  BEGIN
    UPDATE dbo.AppUser
      SET PasswordHash = @PasswordHash,
          Zone = @Zone,
          IsAdmin = 1
    WHERE UserName = @UserName;
  END
  ELSE
  BEGIN
    INSERT INTO dbo.AppUser (UserName, PasswordHash, Zone, IsAdmin)
    VALUES (@UserName, @PasswordHash, @Zone, 1);
  END

  DELETE FROM dbo.AppUser WHERE UserName <> @UserName; -- dejar solo el admin

  SELECT Id, UserName, Zone, IsAdmin, CreatedAt
  FROM dbo.AppUser WHERE UserName = @UserName;
END
GO
