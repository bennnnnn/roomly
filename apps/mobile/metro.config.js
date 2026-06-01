// Metro config tuned for a pnpm monorepo + NativeWind 4.2.
//
// Even with SDK 56's `experiment.onDemandFilesystem` (on by default), pnpm's
// isolated node_modules layout still needs Metro to know about both the local
// package's node_modules and the root-hoisted one. See:
//   https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo so Metro sees workspace package changes.
config.watchFolders = [workspaceRoot];

// 2. Tell Metro where to resolve packages and in what order.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve (sub)dependencies only from the nodeModulesPaths
//    above — never walk up the filesystem.
config.resolver.disableHierarchicalLookup = true;

// 4. NativeWind: register Tailwind's CSS pipeline. Input file is processed
//    by Tailwind, then NativeWind compiles the result into a style atlas
//    consumed at runtime by `nativewind/jsx-runtime`.
module.exports = withNativeWind(config, { input: './global.css' });
