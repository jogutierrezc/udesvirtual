-- Enable pgcrypto extension for gen_random_bytes and other crypto functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Verify the extension is enabled
SELECT 'pgcrypto extension enabled' as status;
