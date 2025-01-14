const { exec } = require('node:child_process');
const chalk = require('chalk');

module.exports.kvStop = async function kvStop() {
  console.log('Stopping KV...');

  try {
    const containerIds = await getContainerIds();
    await stopContainers(containerIds);
    console.log('Stopped KV.');
  } catch (e) {
    console.error(
      chalk.red('There was a problem stopping the containers:\n' + e),
    );
  }
};

function getContainerIds() {
  return new Promise((resolve, reject) => {
    exec('docker ps -a -q --filter="name=kv"', (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        const containerIds = stdout.split('\n');

        resolve(containerIds);
      }
    });
  });
}

function stopContainers(containerIds) {
  return new Promise((resolve, reject) => {
    exec(`docker rm -f ${containerIds.join(' ')}`, error => {
      if (error) reject(error);
      else resolve();
    });
  });
}
