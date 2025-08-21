IF OBJECT_ID('dbo.AppUser', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.AppUser(
      Id            INT IDENTITY(1,1) PRIMARY KEY,
      UserName      NVARCHAR(80)   NOT NULL UNIQUE,
      PasswordHash  NVARCHAR(500)  NOT NULL,
      Zone          NVARCHAR(120)  NOT NULL,
      IsAdmin       BIT            NOT NULL CONSTRAINT DF_AppUser_IsAdmin DEFAULT(0),
      CreatedAt     DATETIME2(0)   NOT NULL CONSTRAINT DF_AppUser_CreatedAt DEFAULT (SYSUTCDATETIME())
  );
END
GO

-- (Opcional) Garantizar único admin
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes 
  WHERE name = 'UX_AppUser_IsAdmin_Single' AND object_id = OBJECT_ID('dbo.AppUser')
)
BEGIN
  CREATE UNIQUE INDEX UX_AppUser_IsAdmin_Single
  ON dbo.AppUser (IsAdmin)
  WHERE IsAdmin = 1;
END
GO
