const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ignore the backend and frontend directories to prevent Metro from scanning them and running out of memory
config.resolver.blockList = [
  /.*\/backend\/.*/,
  /.*\/frontend\/.*/,
];

// Only watch the mobile directory and the root node_modules
const path = require('path');
config.watchFolders = [__dirname, path.resolve(__dirname, '../node_modules')];

module.exports = withNativeWind(config, { input: "./global.css" });
