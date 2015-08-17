// webpack.config.js
module.exports = {
    entry: {
        popup: "./src/js/popup.js",
        bgHelper: "./src/js/bgHelper.js"
    },
    output: {
        path: "./build/js",
        filename: "[name].bundle.js"
    },
    module: {
        loaders: [
            { test: /\.(js|jsx)$/, loader: "babel-loader" }
        ]
    },
    resolve: {
        extensions: ["", ".js", ".jsx"]
    }
};