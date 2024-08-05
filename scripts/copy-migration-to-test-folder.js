/**
 * copies file from @/supabase/migrations/20240711063356_initial_schema.sql --> src/__tests__/supabase/migrations/20240711063356_initial_schema.sql
 */
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(
  __dirname,
  '../supabase/migrations',
  '20240711063356_initial_schema.sql',
);
const destPath = path.join(
  __dirname,
  '../src/__tests__/supabase/migrations',
  '20240711063356_initial_schema.sql',
);

fs.copyFile(sourcePath, destPath, err => {
  if (err) {
    console.error('Error copying the file:', err);
  }
});
