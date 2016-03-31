// webpack.config.js

var webpack = require('webpack');

var commonsPlugin =
  new webpack.optimize.CommonsChunkPlugin('common.js');

module.exports = {
    entry: {
      renderTest: "./src/js/renderTest.js",
      tabliPopup: "./src/js/tabliPopup.js",
      tabliPopout: "./src/js/tabliPopout.js",
      bgHelper: "./src/js/bgHelper.js"
    },
    output: {
        path: "./build/js",
        filename: "[name].bundle.js"
    },
    plugins: [commonsPlugin],
    module: {
        loaders: [
            { test: /\.(js|jsx)$/, 
              exclude: /node_modules/, 
              loader: "babel-loader",
              query: {
                presets:['es2015','react']
              }
            },
            { test: /\.(json)$/, loader: "json-loader" }
        ]
    },
    resolve: {
        extensions: ["", ".js", ".jsx", ".json"]
    }
};