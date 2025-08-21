CREATE OR ALTER PROCEDURE dbo.usp_AppUser_GetByUserName
  @UserName NVARCHAR(80)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP (1) Id, UserName, PasswordHash, Zone, IsAdmin, CreatedAt
  FROM dbo.AppUser
  WHERE UserName = @UserName;
END
GO
