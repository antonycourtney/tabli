// webpack.config.js

var webpack = require('webpack');

var ExtractTextPlugin = require("extract-text-webpack-plugin");

var commonsPlugin =
  new webpack.optimize.CommonsChunkPlugin('common.js');

var cssLoader = ExtractTextPlugin.extract('style-loader', 'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader');

module.exports = {
    entry: {
      renderTest: "./src/js/renderTest.js",
      popup: "./src/js/popup.js",
      newTabPage: "./src/js/newTabPage.js",
      bgHelper: "./src/js/bgHelper.js"
    },
    output: {
        path: "./build/js",
        filename: "[name].bundle.js"
    },
    plugins: [commonsPlugin, new ExtractTextPlugin('../css/style.css', { allChunks: true }),],

  postcss: [
    require('autoprefixer'),
  ],

    module: {
        loaders: [
            { test: /\.(js|jsx)$/, 
              exclude: /node_modules/, 
              loader: "babel-loader",
              query: {
                presets:['es2015','react']
              }
            },
            { test: /\.(json)$/, loader: "json-loader" },
            { test: /\.css$/, loader: cssLoader },
            { test: /\.png$/, loader: "url-loader?limit=100000" }
        ]
    },
    resolve: {
        extensions: ["", ".js", ".jsx", ".json"]
    }
};