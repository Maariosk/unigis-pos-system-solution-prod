USE [$(DB_NAME)];
GO
IF NOT EXISTS (SELECT 1 FROM dbo.PointOfSale)
INSERT INTO dbo.PointOfSale (Latitude, Longitude, [Description], Sale, [Zone]) VALUES
(19.432608, -99.133209, N'Centro Histórico', 12000, N'Zona Centro'),
(19.427020, -99.167665, N'Roma Norte',        8500,  N'Zona Centro'),
(19.390860, -99.283460, N'Santa Fe',          18000, N'Zona Poniente'),
(19.367150, -99.257220, N'San Ángel',         6500,  N'Zona Sur');
GO
