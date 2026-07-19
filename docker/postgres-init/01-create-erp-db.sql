-- Create dedicated ERP database (marketplace uses doorli_db)
SELECT 'CREATE DATABASE doorli_erp OWNER doorli_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'doorli_erp')\gexec
