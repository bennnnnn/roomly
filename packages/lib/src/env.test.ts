import { defineEnv } from './env';

function fakeGetter(values: Record<string, string | undefined>) {
  return (key: string): string | undefined => values[key];
}

describe('defineEnv', () => {
  describe('happy path', () => {
    it('returns required vars typed as string', () => {
      const env = defineEnv(
        {
          EXPO_PUBLIC_FOO: { required: true, visibility: 'public' },
        },
        {
          runtime: 'client',
          publicPrefix: 'EXPO_PUBLIC_',
          getter: fakeGetter({ EXPO_PUBLIC_FOO: 'bar' }),
        },
      );
      expect(env.EXPO_PUBLIC_FOO).toBe('bar');
    });

    it('returns optional vars as undefined when missing', () => {
      const env = defineEnv(
        {
          EXPO_PUBLIC_FOO: { required: false, visibility: 'public' },
        },
        {
          runtime: 'client',
          publicPrefix: 'EXPO_PUBLIC_',
          getter: fakeGetter({}),
        },
      );
      expect(env.EXPO_PUBLIC_FOO).toBeUndefined();
    });

    it('treats empty-string values as undefined (Expo inlines "")', () => {
      const env = defineEnv(
        {
          EXPO_PUBLIC_FOO: { required: false, visibility: 'public' },
        },
        {
          runtime: 'client',
          publicPrefix: 'EXPO_PUBLIC_',
          getter: fakeGetter({ EXPO_PUBLIC_FOO: '' }),
        },
      );
      expect(env.EXPO_PUBLIC_FOO).toBeUndefined();
    });
  });

  describe('hard refusals (retro safety)', () => {
    it('refuses to read a server-only var from a client runtime', () => {
      expect(() =>
        defineEnv(
          {
            SUPABASE_SERVICE_ROLE_KEY: { required: true, visibility: 'server' },
          },
          {
            runtime: 'client',
            publicPrefix: 'EXPO_PUBLIC_',
            getter: fakeGetter({ SUPABASE_SERVICE_ROLE_KEY: 'leaked-secret' }),
          },
        ),
      ).toThrow(/server-only.*client runtime/);
    });

    it('refuses a public var that does not start with the public prefix', () => {
      expect(() =>
        defineEnv(
          {
            SUPABASE_URL: { required: true, visibility: 'public' },
          },
          {
            runtime: 'client',
            publicPrefix: 'EXPO_PUBLIC_',
            getter: fakeGetter({ SUPABASE_URL: 'https://x.supabase.co' }),
          },
        ),
      ).toThrow(/does not start with the public prefix/);
    });

    it('throws a single error listing every problem at once', () => {
      try {
        defineEnv(
          {
            MISSING_REQUIRED: { required: true, visibility: 'public' },
            SERVER_LEAK: { required: false, visibility: 'server' },
          },
          {
            runtime: 'client',
            publicPrefix: 'EXPO_PUBLIC_',
            getter: fakeGetter({}),
          },
        );
        throw new Error('should have thrown');
      } catch (e) {
        const message = (e as Error).message;
        expect(message).toMatch(/MISSING_REQUIRED/);
        expect(message).toMatch(/SERVER_LEAK/);
      }
    });

    it('requires publicPrefix when runtime is client', () => {
      expect(() =>
        defineEnv(
          { FOO: { required: false, visibility: 'public' } },
          { runtime: 'client', getter: fakeGetter({}) },
        ),
      ).toThrow(/publicPrefix is required/);
    });

    it('throws on a missing required var', () => {
      expect(() =>
        defineEnv(
          {
            EXPO_PUBLIC_FOO: { required: true, visibility: 'public' },
          },
          {
            runtime: 'client',
            publicPrefix: 'EXPO_PUBLIC_',
            getter: fakeGetter({}),
          },
        ),
      ).toThrow(/Required env "EXPO_PUBLIC_FOO" is missing/);
    });
  });

  describe('server runtime', () => {
    it('allows reading server-only vars', () => {
      const env = defineEnv(
        {
          SUPABASE_SERVICE_ROLE_KEY: { required: true, visibility: 'server' },
        },
        {
          runtime: 'server',
          getter: fakeGetter({ SUPABASE_SERVICE_ROLE_KEY: 'sr-jwt' }),
        },
      );
      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe('sr-jwt');
    });

    it('does not require publicPrefix on server', () => {
      expect(() =>
        defineEnv(
          { FOO: { required: false, visibility: 'server' } },
          { runtime: 'server', getter: fakeGetter({}) },
        ),
      ).not.toThrow();
    });
  });
});
