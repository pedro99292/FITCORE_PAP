const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package.json exports field to avoid issues with libraries like Supabase
config.resolver.unstable_enablePackageExports = false;

module.exports = config; 