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