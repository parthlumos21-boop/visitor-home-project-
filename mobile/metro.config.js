const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(projectRoot);

// Ignore the backend and frontend directories to prevent Metro from scanning them and running out of memory
config.resolver.blockList = [
  /.*\/backend\/.*/,
  /.*\/frontend\/.*/,
];

// Watch both project and workspace node_modules
config.watchFolders = [projectRoot, path.resolve(workspaceRoot, 'node_modules')];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'react-native-worklets': path.resolve(workspaceRoot, 'node_modules/react-native-worklets'),
  'react-native-reanimated': path.resolve(workspaceRoot, 'node_modules/react-native-reanimated'),
};

module.exports = withNativeWind(config, { 
  input: path.resolve(__dirname, "./global.css"),
  projectRoot: __dirname
});
