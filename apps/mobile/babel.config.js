// CJS on purpose: Expo's CLI loads babel.config.js as CommonJS regardless of
// the package's "type" field.
//
// Reanimated 4 dropped its bundled babel plugin in favor of
// `react-native-worklets/plugin`. NativeWind 4.2 needs `jsxImportSource`
// set on babel-preset-expo so JSX uses the nativewind/jsx-runtime which
// processes className -> style at runtime.
//
// Plugin order matters: react-native-worklets/plugin MUST be last.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: ['react-native-worklets/plugin'],
  };
};
