// CJS on purpose: Expo's CLI loads babel.config.js as CommonJS regardless of
// the package's "type" field.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
