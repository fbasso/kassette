import picocolors from 'picocolors';

import { createGlobalLogger } from '../../logger';
import { defaultHarKeyManager } from '../../../lib/har/harFile';

import { logProperty, logApplicationData, build } from './';

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

function createLogger() {
  const output: { message: any; type: 'log' | 'error' }[] = [];
  const console = {
    log: (message: any) => output.push({ message, type: 'log' }),
    error: (message: any) => output.push({ message, type: 'error' }),
  };
  createGlobalLogger(console);
  const clear = () => (output.length = 0);
  return { output, clear };
}

function highlighted(text: string, color = 'green'): string {
  return picocolors.bold((picocolors as any)[color](text));
}

////////////////////////////////////////////////////////////////////////////////
//
////////////////////////////////////////////////////////////////////////////////

describe('server configuration', () => {
  describe('logProperty', () => {
    it('should log string or scalar property', () => {
      const { output } = createLogger();
      logProperty('test', {
        value: 'text',
        origin: 'default',
      });
      expect(output).toEqual([
        {
          type: 'log',
          message: `- (cli | file | api | ${highlighted('default')}) test: ${highlighted(
            '"text"',
          )}`,
        },
      ]);
    });

    it('should log provided properties', () => {
      const dummy = {};
      const { output } = createLogger();
      logProperty(
        'provided',
        {
          value: dummy,
          origin: 'cli', // anything not default
        },
        true,
      );
      logProperty(
        'not provided',
        {
          value: dummy,
          origin: 'default',
        },
        true,
      );
      expect(output).toEqual([
        {
          type: 'log',
          message: `- (${highlighted('cli')} | file | api | default) provided: ${highlighted('✓')}`,
        },
        {
          type: 'log',
          message: `- (cli | file | api | ${highlighted('default')}) not provided: ${highlighted(
            '✗',
            'red',
          )}`,
        },
      ]);
    });
  });

  describe('logApplicationData', () => {
    it('should log configuration with file', () => {
      const nop = () => {};
      const { output } = createLogger();
      logApplicationData({
        root: 'C:/dummy/root/folder',
        configuration: {
          filePath: 'dummy/conf/path',
          hostname: { value: '127.0.0.1', origin: 'default' },
          port: { value: 8080, origin: 'cli' },
          tlsCAKeyPath: { value: 'dummy/tls/path', origin: 'cli' },
          tlsKeySize: { value: 1024, origin: 'cli' },
          http2: { value: false, origin: 'cli' },
          proxyConnectMode: { value: 'intercept', origin: 'default' },
          onProxyConnect: { value: nop, origin: 'file' },
          remoteURL: { value: 'http://dummy.com:5555', origin: 'file' },
          mocksFormat: { value: 'folder', origin: 'default' },
          mocksFolder: { value: 'dummy/relative', origin: 'file' },
          mocksHarFile: { value: 'dummy/relative.har', origin: 'file' },
          harFileCacheTime: { value: 5 * 60 * 1000, origin: 'default' },
          mocksHarKeyManager: { value: defaultHarKeyManager, origin: 'default' },
          mode: { value: 'remote', origin: 'default' },
          delay: { value: 'recorded', origin: 'default' },
          skipLog: { value: false, origin: 'default' },
          onListen: { value: nop, origin: 'file' },
          hook: { value: nop, origin: 'file' },
          onExit: { value: nop, origin: 'default' },
          console: { value: { log: nop, error: nop }, origin: 'api' },
          saveChecksumContent: { value: true, origin: 'default' },
          saveDetailedTimings: { value: true, origin: 'default' },
          saveInputRequestData: { value: true, origin: 'default' },
          saveInputRequestBody: { value: true, origin: 'default' },
          saveForwardedRequestData: { value: true, origin: 'default' },
          saveForwardedRequestBody: { value: true, origin: 'default' },
        },
      });

      const actualOutput = output.map((m) => m.message).join('\n');
      expect(actualOutput).toEqual(`Running server with configuration:${' '}

- configuration file path: ${highlighted('dummy/conf/path')}
- (cli | file | api | ${highlighted('default')}) skip logs: ${highlighted('✗', 'red')}
- (cli | file | api | ${highlighted('default')}) hostname: ${highlighted('"127.0.0.1"')}
- (${highlighted('cli')} | file | api | default) port: ${highlighted('8080')}
- (cli | ${highlighted('file')} | api | default) URL: ${highlighted('"http://dummy.com:5555"')}
- (${highlighted('cli')} | file | api | default) HTTP/2.0 server: ${highlighted('✗', 'red')}
- (cli | file | api | ${highlighted('default')}) proxy mode: ${highlighted('"remote"')}
- (cli | file | api | ${highlighted('default')}) proxy connect mode: ${highlighted('"intercept"')}
- (${highlighted('cli')} | file | api | default) CA key file path: ${highlighted(
        '"dummy/tls/path"',
      )}
- (${highlighted('cli')} | file | api | default) TLS key size: ${highlighted('1024')}
- (cli | file | api | ${highlighted('default')}) mocks format: ${highlighted('"folder"')}
- (cli | ${highlighted('file')} | api | default) mocks folder: ${highlighted('"dummy/relative"')}
- (cli | ${highlighted('file')} | api | default) mocks har file: ${highlighted(
        '"dummy/relative.har"',
      )}
- (cli | file | api | ${highlighted('default')}) mocks har key manager: ${highlighted('✗', 'red')}
- (cli | file | api | ${highlighted('default')}) delay: ${highlighted('"recorded"')}
- (cli | ${highlighted('file')} | api | default) custom request handler: ${highlighted('✓')}
- (cli | ${highlighted('file')} | api | default) on proxy connect handler: ${highlighted('✓')}
- (cli | ${highlighted('file')} | api | default) on listen handler: ${highlighted('✓')}
- (cli | file | api | ${highlighted('default')}) on exit handler: ${highlighted('✗', 'red')}
- (cli | file | ${highlighted('api')} | default) custom logger: ${highlighted('✓')}

Root folder used for relative paths resolution: ${highlighted('C:/dummy/root/folder')}
`);
    });

    it('should log configuration without file', () => {
      const nop = () => {};
      const { output } = createLogger();
      logApplicationData({
        root: 'C:/dummy/root/folder',
        configuration: {
          filePath: null,
          hostname: { value: '127.0.0.2', origin: 'cli' },
          port: { value: 8080, origin: 'cli' },
          tlsCAKeyPath: { value: null, origin: 'default' },
          tlsKeySize: { value: 2048, origin: 'default' },
          http2: { value: true, origin: 'default' },
          proxyConnectMode: { value: 'forward', origin: 'cli' },
          onProxyConnect: { value: nop, origin: 'api' },
          remoteURL: { value: 'http://dummy.com:5555', origin: 'file' },
          mocksFormat: { value: 'folder', origin: 'default' },
          mocksFolder: { value: 'dummy/relative', origin: 'file' },
          mocksHarFile: { value: 'mocks.har', origin: 'default' },
          harFileCacheTime: { value: 5 * 60 * 1000, origin: 'default' },
          mocksHarKeyManager: { value: defaultHarKeyManager, origin: 'default' },
          mode: { value: 'remote', origin: 'default' },
          delay: { value: 'recorded', origin: 'default' },
          skipLog: { value: false, origin: 'default' },
          onListen: { value: nop, origin: 'file' },
          hook: { value: nop, origin: 'file' },
          onExit: { value: nop, origin: 'default' },
          console: { value: { log: nop, error: nop }, origin: 'api' },
          saveChecksumContent: { value: true, origin: 'default' },
          saveDetailedTimings: { value: true, origin: 'default' },
          saveInputRequestData: { value: true, origin: 'default' },
          saveInputRequestBody: { value: true, origin: 'default' },
          saveForwardedRequestData: { value: true, origin: 'default' },
          saveForwardedRequestBody: { value: true, origin: 'default' },
        },
      });

      const actualOutput = output.map((m) => m.message).join('\n');
      expect(actualOutput).toEqual(`Running server with configuration:${' '}

- configuration file path: ${highlighted('<none>', 'red')}
- (cli | file | api | ${highlighted('default')}) skip logs: ${highlighted('✗', 'red')}
- (${highlighted('cli')} | file | api | default) hostname: ${highlighted('"127.0.0.2"')}
- (${highlighted('cli')} | file | api | default) port: ${highlighted('8080')}
- (cli | ${highlighted('file')} | api | default) URL: ${highlighted('"http://dummy.com:5555"')}
- (cli | file | api | ${highlighted('default')}) HTTP/2.0 server: ${highlighted('✓')}
- (cli | file | api | ${highlighted('default')}) proxy mode: ${highlighted('"remote"')}
- (${highlighted('cli')} | file | api | default) proxy connect mode: ${highlighted('"forward"')}
- (cli | file | api | ${highlighted('default')}) CA key file path: ${highlighted('null')}
- (cli | file | api | ${highlighted('default')}) TLS key size: ${highlighted('2048')}
- (cli | file | api | ${highlighted('default')}) mocks format: ${highlighted('"folder"')}
- (cli | ${highlighted('file')} | api | default) mocks folder: ${highlighted('"dummy/relative"')}
- (cli | file | api | ${highlighted('default')}) mocks har file: ${highlighted('"mocks.har"')}
- (cli | file | api | ${highlighted('default')}) mocks har key manager: ${highlighted('✗', 'red')}
- (cli | file | api | ${highlighted('default')}) delay: ${highlighted('"recorded"')}
- (cli | ${highlighted('file')} | api | default) custom request handler: ${highlighted('✓')}
- (cli | file | ${highlighted('api')} | default) on proxy connect handler: ${highlighted('✓')}
- (cli | ${highlighted('file')} | api | default) on listen handler: ${highlighted('✓')}
- (cli | file | api | ${highlighted('default')}) on exit handler: ${highlighted('✗', 'red')}
- (cli | file | ${highlighted('api')} | default) custom logger: ${highlighted('✓')}

Root folder used for relative paths resolution: ${highlighted('C:/dummy/root/folder')}
`);
    });
  });

  describe('build', () => {
    // please test only what the wrapper does, the logic for loading file and
    // merging is already tested in the lower layer

    it('should work with no input', async () => {
      const result = await build({});
      expect(result).not.toBeNull();
    });

    it('should log file loading error and return', async () => {
      const { output } = createLogger();
      const result = await build({
        apiConfiguration: {},
        cliConfiguration: {},
        configurationPath: 'dummy',
      });
      expect(result).toBeNull();
      expect(output.length).toBe(2);
      expect(output[0].type).toBe('error');
      expect(output[1].type).toBe('error');
    });
  });
});
