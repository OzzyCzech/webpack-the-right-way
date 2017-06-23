import path from  'path';
import webpack from 'webpack';
import CompressionPlugin from 'compression-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const isHot = path.basename(require.main.filename) === 'webpack-dev-server.js';
const isDev = isHot || process.argv.indexOf('-d') !== -1;

console.info( '[DEBUG] Webpack running in ' + (isDev ? 'DEVELOPMENT' : 'PRODUCTION') + ' mode');

const app = {

	context: path.resolve('.'),

	entry: {
		app: './src/app.js'
	},

	output: {
		path: path.resolve(__dirname, './public/'),
		publicPath: isDev ? 'http://localhost:5000/' : '/',
		filename: isDev ? 'js/[name].js' : 'js/[name].[chunkhash].js',
		chunkFilename: isDev ? 'js/[name].js' : 'js/[name].[chunkhash].js'
	},

	devServer: {
		contentBase: [path.join(__dirname, 'public')],
		compress: true,
		host: 'localhost', // 0.0.0.0 || 127.0.0.1 || localhost || example.dev
		port: 5000,
		noInfo: true,
		overlay: true, // zobrazeni chyb
	},

	performance: {hints: isDev ? false : "warning"},

	stats: isDev ? 'verbose' : 'minimal',

	resolve: {
		modules: [path.resolve(__dirname, 'src'), 'node_modules']
	},

	module: {
		rules: [

			// JS loader
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				use: {loader: 'babel-loader'},
			},

			// CSS loader
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: "style-loader",
					use: ['css-loader', 'postcss-loader']
				})
			},

			// Angular HTML template loader
			{
				test: /\.html$/,
				use: {
					loader: 'file-loader',
					options: {name: 'partials/[name].[hash:8].[ext]'}
				}
			},

			// images & fonts loader
			{
				test: /\.(jpe?g|png|gif|webp|eot|ttf|woff|woff2|svg|)$/i,
				use: [
					{loader: 'url-loader', options: {limit: 1000, name: 'assets/[name].[hash].[ext]'}}
				]
			}

		]
	},

	plugins: [

		// Default HTML entry point index.html ...
		new HtmlWebpackPlugin({
					inject: 'head',
					filename: 'index.html',
					chunksSortMode: 'dependency', // necessary to consistently work with multiple chunks via CommonsChunkPlugin
					template: '!!raw-loader!./src/index.html'
				}
		),

		// extract all node_modules to vendor chunk
		new webpack.optimize.CommonsChunkPlugin({
			name: 'vendor',
			minChunks: ({resource}) => (
					resource &&
					resource.indexOf('node_modules') >= 0 &&
					resource.match(/\.js$/)
			)
		}),

		// extract webpack runtime and module manifest to its own file in order to
		// prevent vendor hash from being updated whenever app bundle is updated
		new webpack.optimize.CommonsChunkPlugin({
			name: 'manifest',
			minChunks: Infinity
		}),

		// BC: import jQuery to old plugins... ¯\_(ツ)_/¯
		new webpack.ProvidePlugin({
			'$': 'jquery',
			'jquery': 'jquery',
			'jQuery': 'jquery',
			'window.$': 'jquery',
			'window.jQuery': 'jquery'
		}),

		// extract css into its own
		new ExtractTextPlugin({
					filename: isDev ? 'css/[name].css' : 'css/[name].[contenthash].css',
					disable: isHot,
					allChunks: true
				}
		),

		// do nothing on error
		new webpack.NoEmitOnErrorsPlugin()

	].concat(
			isDev ? [
				new webpack.NamedModulesPlugin(),
			] : [
				new webpack.HashedModuleIdsPlugin({hashFunction: 'sha256'}),

				// gzip results
				new CompressionPlugin({
					asset: '[path].gz[query]',
					algorithm: 'gzip',
					test: /\.(js|css|html)$/
				}),

				// minify js
				new webpack.optimize.UglifyJsPlugin({
					compress: {warnings: false},
					mangle: {
						except: ['$', 'jQuery'] // do not rename jQuery
					}
				}),
			]
	)
};

module.exports = [app];