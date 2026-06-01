/// <reference types="nativewind/types" />

// Metro processes ./global.css via NativeWind's transformer; TS only needs to
// know the side-effect import exists.
declare module '*.css';

// NativeWind 4.2.4 ships an empty index.d.ts for the `preset` subpath. The
// runtime export is a Tailwind preset config object. Pinned to NativeWind 4.2.x
// in ADR-0007; revisit when upstream ships proper types.
declare module 'nativewind/preset' {
  import type { Config } from 'tailwindcss';

  const preset: Partial<Config>;
  export default preset;
}
