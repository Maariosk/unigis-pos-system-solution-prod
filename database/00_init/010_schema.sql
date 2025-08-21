USE [$(DB_NAME)];
GO

IF OBJECT_ID('dbo.PointOfSale', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.PointOfSale (
      Id            INT IDENTITY(1,1) PRIMARY KEY,
      Latitude      DECIMAL(9,6)   NOT NULL,
      Longitude     DECIMAL(9,6)   NOT NULL,
      [Description] NVARCHAR(200)  NOT NULL,
      Sale          DECIMAL(18,2)  NOT NULL CHECK (Sale >= 0),
      [Zone]        NVARCHAR(100)  NOT NULL,
      CreatedAt     DATETIME2(3)   NOT NULL DEFAULT SYSUTCDATETIME(),
      UpdatedAt     DATETIME2(3)   NULL
  );

  CREATE INDEX IX_PointOfSale_Zone   ON dbo.PointOfSale([Zone]);
  CREATE INDEX IX_PointOfSale_LatLng ON dbo.PointOfSale(Latitude, Longitude);
END
GO
