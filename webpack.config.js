// webpack.config.js

var webpack = require('webpack');
var path = require('path');
var fs = require('fs');
const { profileEnd } = require('console');
process.traceDeprecation = true;

function config(nodeEnv) {
    return {
        devtool: 'inline-source-map',
        resolve: {
            extensions: ['.webpack.js', '.web.js', '.js', '.ts', '.tsx']
        },
        entry: {
            bigRenderTest: ['./src/ts/bigRenderTest.tsx'],
            renderTest: ['./src/ts/renderTest.tsx'],
            prefsPage: ['./src/ts/prefsPage.tsx'],
            tabliPopup: ['./src/ts/tabliPopup.ts'],
            tabliPopout: ['./src/ts/tabliPopout.ts'],
            bgHelper: ['./src/ts/bgHelper.ts']
        },
        output: {
            path: __dirname + '/build/js',
            filename: '[name].bundle.js'
        },
        module: {
            rules: [
                // { test: /\.(json)$/, loader: 'raw-loader' },
                // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
                { test: /\.tsx?$/, loader: 'ts-loader' },

                // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
                { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
                {
                    test: /\.less$/,
                    use: ['style-loader', 'css-loader', 'less-loader' ]
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader' ]
                },
                {
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    type: 'asset'
/*                    loaders: [
                        'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
                        'image-webpack-loader?bypassOnDebug&optipng.optimizationLevel=7&gifsicle.interlaced=false'
                    ]
*/
                },
                {
                    test: /\.(eot|svg|ttf|woff|woff2)$/,
                    type: 'asset'
/*                    loader: 'file-loader?name=public/fonts/[name].[ext]' */
                },
                { test: /\.html$/, loader: 'html-loader' }
            ]
        },
        optimization: {
            splitChunks: {
                name: 'common',
                chunks: 'initial',
                minChunks: 2
                // (the commons chunk name)
                // filename: "common.js",
                // (the filename of the commons chunk)
            }
        },
        // When importing a module whose path matches one of the following, just
        // assume a corresponding global variable exists and use that instead.
        // This is important because it allows us to avoid bundling all of our
        // dependencies, which allows browsers to cache those libraries between builds.
        externals: {
            // react: 'React',
            // 'react-dom': 'ReactDOM'
        },
        plugins: []
    };
}

function development() {
    var dev = config('development');
    Object.assign(dev.optimization, {
        minimize: false
    });

    return dev;
}

function production() {
    var prod = config('production');
    prod.plugins.push(
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    );
    prod.optimization.chunkIds = 'total-size';
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
    prod: production()
};

module.exports = function(env, argv) {
    let mode = (argv.mode === 'production') ? 'prod' : 'dev';
    let ret = configMap[mode];
    return ret;
};
