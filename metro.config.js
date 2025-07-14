const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable package.json exports field to avoid issues with libraries like Supabase
config.resolver.unstable_enablePackageExports = false;

// Configure supported platforms
config.resolver.platforms = ['ios', 'android', 'web'];

// Configure transformer to handle router issues and optimize for production
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer.minifierConfig,
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
  // Ensure proper asset handling
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Configure resolver to handle node_modules properly
config.resolver.nodeModulesPaths = [
  './node_modules',
];

// Configure serializer for better chunking
config.serializer = {
  ...config.serializer,
  createModuleIdFactory: () => (path) => {
    // Use relative paths for better caching
    return path.replace(__dirname, '').replace(/\\/g, '/');
  },
};

// Configure cache settings
config.cacheStores = [
  {
    get: (key) => {
      // Simple in-memory cache for development
      return Promise.resolve(null);
    },
    set: (key, value) => {
      return Promise.resolve();
    },
  },
];

// Configure watchman ignore patterns
config.watchFolders = [__dirname];

module.exports = config; 