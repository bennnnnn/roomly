/**
 * Boot-time environment-variable validator.
 *
 * Apps declare expected env vars in a schema. `defineEnv`:
 *   - Throws at module-load time if any required var is missing
 *     (loud-and-early; preferred over mystery 401s at first request).
 *   - In a `client` runtime, refuses to expose vars not marked `public`
 *     — i.e. vars whose name does NOT start with the platform's public
 *     prefix (`EXPO_PUBLIC_` for Expo, `NEXT_PUBLIC_` for Next).
 *   - Returns a typed env object where required vars are `string` and
 *     optional vars are `string | undefined`.
 *
 * The retro called out a footgun where server-only secrets leaked into the
 * mobile bundle via raw `process.env.SOMETHING`. This module makes that
 * mistake fail at compile (visibility marker + prefix check) AND fail at
 * boot, so it never reaches a shipped binary.
 */

export type EnvVisibility = 'public' | 'server';
export type EnvRuntime = 'client' | 'server';

export interface EnvSchemaEntry {
  required: boolean;
  visibility: EnvVisibility;
}

export type EnvSchema = Record<string, EnvSchemaEntry>;

export interface DefineEnvOptions {
  runtime: EnvRuntime;
  getter: (key: string) => string | undefined;
  /** Required when `runtime === 'client'`. Public vars must start with this prefix. */
  publicPrefix?: string;
}

export type EnvResult<S extends EnvSchema> = {
  [K in keyof S]: S[K]['required'] extends true ? string : string | undefined;
};

export function defineEnv<S extends EnvSchema>(schema: S, opts: DefineEnvOptions): EnvResult<S> {
  if (opts.runtime === 'client' && !opts.publicPrefix) {
    throw new Error("defineEnv: opts.publicPrefix is required when runtime === 'client'.");
  }

  const result: Record<string, string | undefined> = {};
  const errors: string[] = [];

  for (const [key, entry] of Object.entries(schema)) {
    // Hard refusal #1: server-only vars cannot be read from a client runtime.
    // (Catches the retro's "service-role JWT in the mobile bundle" footgun.)
    if (opts.runtime === 'client' && entry.visibility === 'server') {
      errors.push(
        `Env "${key}" is marked server-only but is being read from a client runtime. ` +
          `Move this var to an Edge Function or change its visibility.`,
      );
      continue;
    }

    // Hard refusal #2: client-public vars must use the platform's public
    // prefix. Otherwise the bundler will NOT inline them and the var will
    // silently be undefined at runtime.
    if (
      opts.runtime === 'client' &&
      entry.visibility === 'public' &&
      opts.publicPrefix !== undefined &&
      !key.startsWith(opts.publicPrefix)
    ) {
      errors.push(
        `Env "${key}" is marked public but does not start with the public prefix "${opts.publicPrefix}". ` +
          `Rename it or the client bundler will not inline its value.`,
      );
      continue;
    }

    const raw = opts.getter(key);
    const value = raw === '' ? undefined : raw;

    if (entry.required && value === undefined) {
      errors.push(`Required env "${key}" is missing.`);
      continue;
    }

    result[key] = value;
  }

  if (errors.length > 0) {
    throw new Error(`Env validation failed:\n  - ${errors.join('\n  - ')}`);
  }

  return result as EnvResult<S>;
}
