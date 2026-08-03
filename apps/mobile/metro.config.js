const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');
const config = getDefaultConfig(projectRoot);


config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enableSymlinks = true;
config.resolver.extraNodeModules = new Proxy(
  {},
  {
    get: (_target, name) => path.join(projectRoot, 'node_modules', String(name))
  }
);

// Packages that must resolve to a single copy to avoid hook errors
const FORCE_LOCAL = new Set([
  'react',
  'react-native',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  'react-native/Libraries/Utilities/Platform',
]);

// Intercept expo-asset/AssetUris and serve our patched version.
// Also force React/RN to always resolve from this project's node_modules
// to prevent the "multiple copies of React" invalid-hook-call error.
const ASSET_URIS_PATCH = path.resolve(projectRoot, 'patches/AssetUris.js');
const GOOGLE_SIGNIN_MOCK = path.resolve(projectRoot, 'patches/googleSigninMock.js');
const LOCAL_NM = path.resolve(projectRoot, 'node_modules');

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Mock Google Sign-In when native module is not linked in the installed APK
  if (moduleName === '@react-native-google-signin/google-signin') {
    return { filePath: GOOGLE_SIGNIN_MOCK, type: 'sourceFile' };
  }

  // Redirect AssetUris to our patched version (bypasses stale transform cache)
  if (
    moduleName.endsWith('AssetUris') ||
    moduleName.endsWith('AssetUris.js') ||
    moduleName.endsWith('AssetUris.ts')
  ) {
    return { filePath: ASSET_URIS_PATCH, type: 'sourceFile' };
  }

  // Force single copy of React and React Native
  if (FORCE_LOCAL.has(moduleName)) {
    try {
      const filePath = require.resolve(moduleName, { paths: [LOCAL_NM] });
      return { filePath, type: 'sourceFile' };
    } catch (_) {
      // fall through to default resolver
    }
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
