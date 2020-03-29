// webpack.config.js

var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
process.traceDeprecation = true;

function config(nodeEnv) {
    return {
        devtool: 'inline-source-map',
        resolve: {
            extensions: [
                '.webpack.js',
                '.web.js',
                '.js',
                '.ts',
                '.tsx',
                '.scss',
            ],
        },
        entry: {
            bigRenderTest: ['./src/ts/bigRenderTest.tsx'],
            renderTest: ['./src/ts/renderTest.tsx'],
            prefsPage: ['./src/ts/prefsPage.tsx'],
            tabliPopup: ['./src/ts/tabliPopup.ts'],
            tabliPopout: ['./src/ts/tabliPopout.ts'],
            bgHelper: ['./src/ts/bgHelper.ts'],
            bulmaHelper: ['./src/bulmaHelper.js'],
        },
        output: {
            path: __dirname + '/build/js',
            filename: '[name].bundle.js',
        },
        module: {
            rules: [
                // { test: /\.(json)$/, loader: 'raw-loader' },
                // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
                { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },

                // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
                { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
                {
                    test: /\.scss$/,
                    use: [
                        MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: true,
                                // options...
                            },
                        },
                    ],
                },
                {
                    test: /\.less$/,
                    loader: 'style-loader!css-loader!less-loader',
                },
                {
                    test: /\.css$/,
                    loader: 'style-loader!css-loader',
                },
                {
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    loaders: [
                        'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
                        'image-webpack-loader?bypassOnDebug&optipng.optimizationLevel=7&gifsicle.interlaced=false',
                    ],
                },
                {
                    test: /\.(eot|svg|ttf|woff|woff2)$/,
                    loader: 'file-loader?name=public/fonts/[name].[ext]',
                },
                { test: /\.html$/, loader: 'html-loader' },
            ],
        },
        optimization: {
            splitChunks: {
                name: 'common',
                chunks: 'initial',
                minChunks: 2,
                // (the commons chunk name)
                // filename: "common.js",
                // (the filename of the commons chunk)
            },
        },
        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        // This is important because it allows us to avoid bundling all of our
        // dependencies, which allows browsers to cache those libraries between builds.
        externals: {
            // react: 'React',
            // 'react-dom': 'ReactDOM'
        },
        plugins: [
            new MiniCssExtractPlugin({
                // This seems to be relative to build/js, so try ..:
                filename: '../css/bulma-styles.css',
            }),
        ],
    };
}

function development() {
    var dev = config('development');
    Object.assign(dev.optimization, {
        minimize: false,
    });

    return dev;
}

function production() {
    var prod = config('production');
    prod.plugins.push(
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        })
    );
    prod.plugins.push(new webpack.optimize.OccurrenceOrderPlugin(true));
    prod.optimization.minimize = true;

    // for profiling:
    /*
    prod.optimization.minimize = false; // avoids mangling
    prod.resolve.alias = {
        'react-dom$': 'react-dom/profiling',
        'scheduler/tracing': 'scheduler/tracing-profiling'
    };
    console.log('profuction config: ', prod);
    */
    return prod;
}

const configMap = {
    dev: development(),
    prod: production(),
};

module.exports = function (env) {
    if (!env) {
        env = 'dev';
    }
    return configMap[env];
};
