const { kvStart } = require('./kv-start');
const { kvStop } = require('./kv-stop');

module.exports.kv = function kv() {
  const command = process.argv[2];

  if (!['start', 'stop'].includes(command)) {
    throw new Error('Invalid argument. Valid arguments are "start" or "stop"');
  }

  if (command === 'start') {
    kvStart();
  } else {
    kvStop();
  }
};
