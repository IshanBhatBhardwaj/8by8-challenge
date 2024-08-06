/**
 * copies file from @/supabase/migrations/20240711063356_initial_schema.sql --> src/__tests__/supabase/migrations/20240711063356_initial_schema.sql
 */
const fs = require('fs');
const path = require('path');

let sourcePath = path.join(
  __dirname,
  '../supabase/migrations',
  '20240711063356_initial_schema.sql',
);
let destPath = path.join(
  __dirname,
  '../src/__tests__/supabase/migrations',
  '20240711063356_initial_schema.sql',
);

let count = 0;
let modifiedSourcePath = sourcePath.replace(/\/8by8-challenge/g, (match) => {
  count++;
  return (count === 2) ? '' : match;
});

count = 0;
modifiedDestinationPath = destPath.replace(/\/8by8-challenge/g, (match) => {
  count++;
  return (count === 2) ? '' : match;
});

fs.copyFile(modifiedSourcePath, modifiedDestinationPath, err => {
  if (err) {
    console.error('Error copying the file:', err);
  }
  else {
    console.log("Copied 20240711063356_initial_schema.sql into /src/__tests__/supabase/migrations\n")
  }
});
