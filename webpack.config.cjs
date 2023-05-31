const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path')
const webpack = require('webpack')

module.exports = {
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')

  },
  module: {
    rules: [
      { test: /\.js$/, include: /node_modules/, type: 'javascript/auto' }
    ]
  },
  target: 'node',
  mode: 'development',
  plugins: [
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
    new NodePolyfillPlugin()
  ]
}
