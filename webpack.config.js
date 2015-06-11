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
            { test: /\.(js|jsx)$/, loader: "jsx-loader?harmony" },
            { test: /\.css$/, loader: "style-loader!css-loader" },
            { test: /\.(png|jpg)$/, loader: "url-loader?limit=8192"},
            { test: /\.json$/, loader: "json"}
        ]
    },
    resolve: {
        // require('module') instead of require('module.js')
        extensions: ["", ".js", ".jsx", ".json"]
    }
};