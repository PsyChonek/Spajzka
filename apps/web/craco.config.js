module.exports = {
  devServer:
    {
      port: 'auto'
    },
  webpack: {
    configure: {
      experiments: {
        topLevelAwait: true,
      },
      resolve: {
        fallback: {
          fs: false,
          "path": require.resolve("path-browserify"),
          "os": require.resolve("os-browserify")
        },
      },
    },
  },
};