import path from  'path';
import webpack from 'webpack';
import CompressionPlugin from 'compression-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import PreloadWebpackPlugin from 'preload-webpack-plugin';

const isDevelopment = !Boolean(process.env.NODE_ENV === 'production');

module.exports = {
	context: path.resolve('.'),
	entry: {
		app: './src/app.js'
	},

	output: {
		publicPath: '/',
		pathinfo: isDevelopment,
		path: path.resolve(__dirname, './public/'),
		filename: isDevelopment ? 'js/[name].js' : 'js/[name].[chunkhash].js',
		chunkFilename: isDevelopment ? 'js/[name].js' : 'js/[name].[chunkhash].js'
	},	

	resolve: {
		modules: [path.resolve(__dirname, 'src'), 'node_modules']
	},

	module: {
		rules: [

			// CSS loader
			{
				test: /\.css$/,
				use: ExtractTextPlugin.extract({
					fallback: "style-loader",
					use: ['css-loader', 'postcss-loader']
				})
			},

			// Js loader
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				use: {loader: 'babel-loader'},
			},

			// Angular templates loader...
			{
				test: /\.html$/,
				use: {
					loader: 'file-loader',
					options: {name: isDevelopment ? 'partials/[name].[ext]' : 'partials/[name].[hash:8].[ext]'}
				}
			},
		]		
	},

	plugins: [

		new webpack.DefinePlugin({'env': process.env}), // add process.env to js code

		// Integration with Latte templates...
		new HtmlWebpackPlugin({
				inject: 'head',
				filename: '../src/latte/assets.latte',
				template: '!!raw-loader!./src/assets/assets.latte',
				chunksSortMode: 'dependency' // necessary to consistently work with multiple chunks via CommonsChunkPlugin
			}
		),

		// Custom HTML entrypoint...
		new HtmlWebpackPlugin({
				inject: 'head',
				filename: 'index.html',
				template: '!!raw-loader!./src/assets/index.html',
				chunksSortMode: 'dependency' // necessary to consistently work with multiple chunks via CommonsChunkPlugin
			}
		),

		// Default HTML entrypoint index.html ...
		// new HtmlWebpackPlugin({
		// 		inject: 'head',								
		// 		chunksSortMode: 'dependency' // necessary to consistently work with multiple chunks via CommonsChunkPlugin
		// 	}
		// ),

		new PreloadWebpackPlugin(), // Dynamic chunks preload

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

		new webpack.IgnorePlugin(/(locale)/, /moment$/), // skip locale from moment

		// BC: import jQuery to old plugins... ¯\_(ツ)_/¯ 
		new webpack.ProvidePlugin({
			'$': 'jquery',
			'jquery': 'jquery',
			'jQuery': 'jquery',
			'window.$': 'jquery',
			'window.jQuery': 'jquery'
		}),

		// extract css into its own
		new ExtractTextPlugin(isDevelopment ? 'css/[name].css' : 'css/[name].[chunkhash].css'),

 		// do nothing on error
		new webpack.NoEmitOnErrorsPlugin()

	].concat(
		isDevelopment ? [				
				new webpack.NamedModulesPlugin(),
				new webpack.LoaderOptionsPlugin({debug: true})
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
						compress: {
							warnings: false
						},
						mangle: {
							except: ['$', 'jQuery'] // do not rename jQuery
						}
					}
				),
			]
	)
};