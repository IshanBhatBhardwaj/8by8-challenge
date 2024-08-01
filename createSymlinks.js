
const fs = require('fs');
const path = require('path');

// Define the paths to the files
const databaseFilePath = path.join(__dirname, 'supabase/migrations', '20240711063356_initial_schema.sql');
const testFilePath = path.join(__dirname, 'src/__tests__/supabase/migrations', '20240711063356_initial_schema.sql');

// Function to create a symbolic link
function createSymlink(source, destination) {
  fs.symlink(source, destination, 'file', (err) => {
    if (err) {
      console.error(`Error creating symlink: ${err.message}`);
    } else {
      console.log(`Symlink created: ${destination} -> ${source}`);
    }
  });
}

// Create the symlink
createSymlink(databaseFilePath, testFilePath);