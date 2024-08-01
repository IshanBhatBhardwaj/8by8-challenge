
const fs = require('fs');
const path = require('path');

// Define the paths to the files
const databaseFilePath = path.join(__dirname, 'supabase/migrations', '20240711063356_initial_schema.sql');
const testFilePath = path.join(__dirname, 'src/__tests__/supabase/migrations', '20240711063356_initial_schema.sql');

// Function to create a symbolic link
function createSymlink(source, destination) {
  fs.stat(destination, (err, stats) => {
    if (!err) {
      console.log(`Existing file or symlink at ${destination}:`);
      console.log(`- Is a symlink: ${stats.isSymbolicLink()}`);
      console.log(`- Is a file: ${stats.isFile()}`);
      console.log(`- Is a directory: ${stats.isDirectory()}`);
      console.log(`- Size: ${stats.size} bytes`);
      console.log(`- Last modified: ${stats.mtime}`);
      
      if (stats.isSymbolicLink() || stats.isFile()) {
        console.log(`Removing existing file or symlink at ${destination}.`);
        fs.unlink(destination, (unlinkErr) => {
          if (unlinkErr) {
            console.error(`Error removing existing file: ${unlinkErr.message}`);
          } else {
            fs.symlink(source, destination, 'file', (symlinkErr) => {
              if (symlinkErr) {
                console.error(`Error creating symlink: ${symlinkErr.message}`);
              } else {
                console.log(`Symlink created: ${destination} -> ${source}`);
              }
            });
          }
        });
      } else {
        console.error(`Error: ${destination} exists but is not a file or symlink.`);
      }
    } else if (err.code === 'ENOENT') {
      fs.symlink(source, destination, 'file', (symlinkErr) => {
        if (symlinkErr) {
          console.error(`Error creating symlink: ${symlinkErr.message}`);
        } else {
          console.log(`Symlink created: ${destination} -> ${source}`);
        }
      });
    } else {
      console.error(`Error checking destination: ${err.message}`);
    }
  });
}

createSymlink(databaseFilePath, testFilePath);