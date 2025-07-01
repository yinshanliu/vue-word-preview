const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  publicPath: '/vue-word-preview/',
  transpileDependencies: ['pdfjs-dist'],
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'node_modules/pdfjs-dist/build/pdf.worker.js',
            to: 'pdfjs/'
          }
        ]
      })
    ]
  }
}