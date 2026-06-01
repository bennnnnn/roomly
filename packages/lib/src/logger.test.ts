import { consoleAdapter, createLogger, type LogAdapter } from './logger';

type Call = [string, string, Record<string, unknown> | undefined];

function recordingAdapter(): LogAdapter & { calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    log(level, message, context) {
      calls.push([level, message, context]);
    },
  };
}

// Named so ESLint's no-empty-function rule doesn't flag inline `() => {}`.
const silence = (): void => undefined;

describe('createLogger', () => {
  describe('no-op fallback', () => {
    it('does not throw when called with zero adapters', () => {
      const log = createLogger();
      expect(() => {
        log.debug('d');
        log.info('i');
        log.warn('w');
        log.error('e');
      }).not.toThrow();
    });
  });

  describe('adapter fan-out', () => {
    it('emits to every adapter in order', () => {
      const a = recordingAdapter();
      const b = recordingAdapter();
      const log = createLogger({ adapters: [a, b] });
      log.error('boom', { reqId: '123' });
      expect(a.calls).toEqual([['error', 'boom', { reqId: '123' }]]);
      expect(b.calls).toEqual([['error', 'boom', { reqId: '123' }]]);
    });

    it('passes context through unchanged', () => {
      const a = recordingAdapter();
      const log = createLogger({ adapters: [a] });
      const ctx = { nested: { a: 1 }, list: [1, 2, 3] };
      log.info('hi', ctx);
      expect(a.calls[0]?.[2]).toBe(ctx);
    });
  });

  describe('minLevel', () => {
    it('drops events below the threshold (default info → debug suppressed)', () => {
      const a = recordingAdapter();
      const log = createLogger({ adapters: [a] });
      log.debug('suppressed');
      log.info('kept');
      expect(a.calls.map((c) => c[0])).toEqual(['info']);
    });

    it('honors a custom minLevel', () => {
      const a = recordingAdapter();
      const log = createLogger({ adapters: [a], minLevel: 'warn' });
      log.info('suppressed');
      log.warn('kept');
      log.error('kept');
      expect(a.calls.map((c) => c[0])).toEqual(['warn', 'error']);
    });

    it('allows debug when minLevel is debug', () => {
      const a = recordingAdapter();
      const log = createLogger({ adapters: [a], minLevel: 'debug' });
      log.debug('kept');
      expect(a.calls.map((c) => c[0])).toEqual(['debug']);
    });
  });

  describe('crash safety', () => {
    it('never throws when one adapter throws — and still fans out to the others', () => {
      const broken: LogAdapter = {
        log() {
          throw new Error('adapter is broken');
        },
      };
      const ok = recordingAdapter();
      const log = createLogger({ adapters: [broken, ok] });
      expect(() => log.error('msg')).not.toThrow();
      expect(ok.calls).toEqual([['error', 'msg', undefined]]);
    });
  });

  describe('consoleAdapter', () => {
    it('routes each level to the matching console method', () => {
      const debug = jest.spyOn(console, 'debug').mockImplementation(silence);
      const info = jest.spyOn(console, 'info').mockImplementation(silence);
      const warn = jest.spyOn(console, 'warn').mockImplementation(silence);
      const error = jest.spyOn(console, 'error').mockImplementation(silence);

      try {
        consoleAdapter.log('debug', 'd');
        consoleAdapter.log('info', 'i');
        consoleAdapter.log('warn', 'w');
        consoleAdapter.log('error', 'e');

        expect(debug).toHaveBeenCalledWith('[debug] d');
        expect(info).toHaveBeenCalledWith('[info] i');
        expect(warn).toHaveBeenCalledWith('[warn] w');
        expect(error).toHaveBeenCalledWith('[error] e');
      } finally {
        debug.mockRestore();
        info.mockRestore();
        warn.mockRestore();
        error.mockRestore();
      }
    });

    it('appends context as the second argument when present', () => {
      const info = jest.spyOn(console, 'info').mockImplementation(silence);
      try {
        consoleAdapter.log('info', 'msg', { x: 1 });
        expect(info).toHaveBeenCalledWith('[info] msg', { x: 1 });
      } finally {
        info.mockRestore();
      }
    });
  });
});
