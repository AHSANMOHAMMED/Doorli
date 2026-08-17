const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const mobileNodeModules = path.join(projectRoot, 'node_modules');

const config = getDefaultConfig(projectRoot);

// Keep Expo/React Native on the mobile workspace's React 19 copy instead of
// resolving the marketplace web workspace's React 18 copy from the monorepo root.
config.watchFolders = [workspaceRoot];
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [mobileNodeModules, path.join(workspaceRoot, 'node_modules')];
config.resolver.extraNodeModules = {
  react: path.join(mobileNodeModules, 'react'),
  'react-dom': path.join(mobileNodeModules, 'react-dom'),
};

module.exports = config;
