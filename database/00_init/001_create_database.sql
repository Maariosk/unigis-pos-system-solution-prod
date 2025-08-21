-- Crea la BD si no existe (usa variable DB_NAME de SQLCMD)
IF DB_ID('$(DB_NAME)') IS NULL
BEGIN
  PRINT 'Creating database $(DB_NAME)...';
  EXEC ('CREATE DATABASE [' + '$(DB_NAME)' + ']');
END
GO
