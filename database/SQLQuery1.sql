select * from AppUser

USE PuntosVentaDB;
SELECT TOP(1) Id, UserName, IsAdmin, Zone, LEFT(PasswordHash, 10) AS HashPref
FROM dbo.AppUser
WHERE UserName='admin';
-- Debe tener IsActive=1, Zone=Naucalpan, PasswordHash que empieza con 'AQAAAA' (formato Identity)
