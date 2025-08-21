CREATE OR ALTER PROC dbo.usp_AppUser_GetByUsername
  @UserName nvarchar(256)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP(1) Id, UserName, PasswordHash, Zone, IsAdmin
  FROM dbo.AppUser
  WHERE UserName = @UserName;
END