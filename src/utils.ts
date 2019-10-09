import { StartupMessage } from './types';

export const readStartupData = (data: Buffer) => {
  const size = data.readInt32BE(0);
  const version = data.readInt32BE(4);
  const opts = data
    .slice(8)
    .toString()
    .trim()
    .split('\0');
  const parameters: StartupMessage = { user: '' };

  while (opts.length) {
    const key = opts.shift();
    const value = opts.shift();

    if (key) {
      parameters[key] = value;
    }
  }

  return {
    size,
    version,
    parameters,
  };
};
