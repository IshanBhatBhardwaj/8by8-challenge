const compose = require('docker-compose');
const path = require('path');
const chalk = require('chalk');

module.exports.kvStart = function kvStart() {
  console.log('Starting KV...');

  compose.upAll({ cwd: path.join(__dirname), log: true }).then(
    () => {
      console.log(chalk.bold.green('Started KV!'));
      console.log(chalk.cyanBright('Rest API Url: ') + 'http://localhost:8079');
      console.log(chalk.cyanBright('Rest API Token: ') + 'kv_token');
    },
    err => {
      console.log(chalk.red('Failed to start KV: ', err.message));
    },
  );
};
