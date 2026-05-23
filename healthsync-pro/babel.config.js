module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // Required for react-native-reanimated — MUST be last
    'react-native-reanimated/plugin',
  ],
  env: {
    production: {
      plugins: [
        // Remove console.log in production builds
        'transform-remove-console',
      ],
    },
  },
};
