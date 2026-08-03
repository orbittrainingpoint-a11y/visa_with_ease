// Stub for @react-native-google-signin/google-signin when native module is not linked.
// Allows the JS bundle to load; Google Sign-In buttons will be non-functional.
const GoogleSignin = {
  configure: () => {},
  hasPlayServices: () => Promise.reject(new Error('Google Sign-In native module not linked')),
  signIn: () => Promise.reject(new Error('Google Sign-In native module not linked')),
  signOut: () => Promise.resolve(),
  isSignedIn: () => Promise.resolve(false),
  getCurrentUser: () => null,
  revokeAccess: () => Promise.resolve(),
};

const statusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
};

module.exports = { GoogleSignin, statusCodes };
