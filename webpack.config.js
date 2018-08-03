// webpack.config.js

var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

process.traceDeprecation = true

function config(nodeEnv) {
  return {
    devtool: "source-map",
    resolve: {
        extensions: [".webpack.js", ".web.js", ".js"]
    },
    entry: {
      prefsPage: ["babel-polyfill", "./src/js/prefsPage.js"],
      renderTest: ["babel-polyfill", "./src/js/renderTest.js"],
      tabliPopup: ["babel-polyfill", "./src/js/tabliPopup.js"],
      tabliPopout: ["babel-polyfill", "./src/js/tabliPopout.js"],
      bgHelper: ["babel-polyfill", "./src/js/bgHelper.js"]
    },
    output: {
        path: __dirname + '/build/js',
        filename: "[name].bundle.js"
    },
    module: {
        rules: [
          { test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            loader: "babel-loader?presets[]=es2015,presets[]=react,presets[]=stage-3,plugins[]=transform-class-properties"
          },
          { test: /\.(json)$/, loader: "json-loader" },
          {
            test: /\.less$/,
            loader: 'style-loader!css-loader!less-loader'
          },
          {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
          },
          {
            test: /\.(jpe?g|png|gif|svg)$/i,
            loaders: [
                'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
                'image-webpack-loader?bypassOnDebug&optipng.optimizationLevel=7&gifsicle.interlaced=false'
            ]
          },
          {
            test: /\.(eot|svg|ttf|woff|woff2)$/,
            loader: 'file-loader?name=public/fonts/[name].[ext]'
          },
          { test: /\.html$/,
            loader: "html-loader"
          }
        ]
    },
    optimization: {
      splitChunks: {
        name: "common",
        chunks: "initial",
        minChunks: 2
        // (the commons chunk name)
        // filename: "common.js",
        // (the filename of the commons chunk)
      }
    },
    plugins: []
  }
}

function development() {
  var dev = config('development')
  return dev;
}

function production () {
  var prod = config('production')
  prod.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    })
  )
  prod.plugins.push(new webpack.optimize.OccurrenceOrderPlugin(true))
  prod.optimization.minimize = {
    compress: {
      warnings: false
    },
    mangle: {
      except: ['module', 'exports', 'require']
    }
  }
  return prod
}

const configMap = {
  dev: development(),
  prod: production()
}

module.exports = function (env) {
  if (!env) {
    env = 'dev'
  }
  return configMap[env]
}
