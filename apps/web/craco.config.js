module.exports = {
  devServer:
    {
      port: 3000,
      host: '0.0.0.0',
      // Enable hot reload in Docker
      hot: true,
      // Use watchFiles for Docker environment (webpack-dev-server v4+)
      watchFiles: {
        paths: ['src/**/*', 'public/**/*'],
        options: {
          usePolling: true,
          interval: 1000,
        }
      }
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