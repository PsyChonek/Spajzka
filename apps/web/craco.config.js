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
    },
  },
};