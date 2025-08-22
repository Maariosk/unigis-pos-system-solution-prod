SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
/*
========================================================================================
  Nombre     : dbo.usp_AppUser_GetByUsername
  Propósito  : Devuelve (TOP 1) el usuario que coincide con UserName.
  Tabla      : dbo.AppUser (Id, UserName, PasswordHash, Zone, IsAdmin, ...)
  Autor      : Mario C.
  Creado     : 2025-08-21
  Cambios    :
    - 2025-08-21 (Mario C.): Creación. Normalización de entrada y validación.
========================================================================================
*/
CREATE OR ALTER PROCEDURE dbo.usp_AppUser_GetByUsername
    @UserName NVARCHAR(256)
AS
BEGIN
    SET NOCOUNT ON;

    -- Normaliza el parámetro (trim) y valida requerido
    DECLARE @UserNameNorm NVARCHAR(256) = NULLIF(LTRIM(RTRIM(@UserName)), N'');
    IF @UserNameNorm IS NULL
        THROW 50001, 'UserName es requerido.', 1;

    SELECT TOP (1)
           u.Id,
           u.UserName,
           u.PasswordHash,
           u.Zone,
           u.IsAdmin
    FROM dbo.AppUser AS u
    WHERE u.UserName = @UserNameNorm;
END
GO
