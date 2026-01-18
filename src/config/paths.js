import path from 'node:path';

export function getOutputPaths(dateString) {
  return {
    rawCsv: path.posix.join('data', 'raw', `tasks_${dateString}.csv`),
    parsedJson: path.posix.join('data', 'parsed', `tasks_${dateString}.json`),
  };
}
