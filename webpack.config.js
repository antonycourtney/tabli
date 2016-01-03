// webpack.config.js

var webpack = require('webpack');

var commonsPlugin =
  new webpack.optimize.CommonsChunkPlugin('common.js');

module.exports = {
  entry: {
    popup: "./src/ts/popup.tsx",
    bgHelper: "./src/ts/bgHelper.tsx",
  },
  output: {
      path: "./build/js",
      filename: "[name].bundle.js"
  },
  plugins: [commonsPlugin],
  module: {
      loaders: [
          { test: /\.(ts|tsx)$/, 
            exclude: /node_modules/, 
            loader: "babel-loader?presets=es2015!ts-loader"
          },
          { test: /\.(json)$/, loader: "json-loader" }
      ]
  },
  resolve: {
      extensions: ["", ".js", ".jsx", ".ts", ".tsx", ".json"]
  }
};