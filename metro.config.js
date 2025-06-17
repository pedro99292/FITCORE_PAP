const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package.json exports field to avoid issues with libraries like Supabase
config.resolver.unstable_enablePackageExports = false;

// Suppress bundle validation warnings
config.resolver.platforms = ['ios', 'android', 'web'];

// Configure transformer to handle router issues
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    keep_fnames: true,
  },
};

module.exports = config; 