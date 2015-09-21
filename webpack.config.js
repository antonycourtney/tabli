// webpack.config.js

var webpack = require('webpack');

var commonsPlugin =
  new webpack.optimize.CommonsChunkPlugin('common.js');

module.exports = {
    entry: {
      renderTest: "./src/js/renderTest.js",
        popup: "./src/js/popup.js",
        bgHelper: "./src/js/bgHelper.js"
    },
    output: {
        path: "./build/js",
        filename: "[name].bundle.js"
    },
    plugins: [commonsPlugin],
    module: {
        loaders: [
            { test: /\.(js|jsx)$/, exclude: /node_modules/, loader: "babel-loader" },
            { test: /\.(json)$/, loader: "json-loader" }
        ]
    },
    resolve: {
        extensions: ["", ".js", ".jsx", ".json"]
    }
};