import { join, resolve } from 'path';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CompressionPlugin from 'compression-webpack-plugin';

const isHot = process.argv.indexOf('serve') !== -1; // detect webpack serve
const isDev = process.argv.indexOf('development') !== -1; // detect --mode development

console.info(`Webpack ${isHot ? 'serve HMR server' : 'BUILDING output'} in ${isDev ? 'DEVELOPMENT' : 'PRODUCTION'} mode`)

const app = {

	context: resolve('.'),

	entry: {
		app: "./src/app.js"
	},

	output: {
		path: resolve(__dirname, "./public/"),
		publicPath: isHot ? "http://localhost:5000/" : "/",
		filename: isDev ? '[name].js' : '[name].[chunkhash].js',
		chunkFilename: isDev ? '[name].js' : '[name].[chunkhash].js'
	},

	resolve: {
		modules: [resolve(__dirname, 'src'), 'node_modules']
	},

	devServer: {
		compress: true,
		host: "localhost",
		allowedHosts: 'all',
		headers: { 'Access-Control-Allow-Origin': '*' },
		hot: true,
		port: 5000,
	},

	module: {
		rules: [

			// JS
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				use: { loader: "babel-loader" },
			},


			// Styles
			{
				test: /\.(scss|css)$/,
				use: isHot ? ["style-loader", "css-loader", "postcss-loader", "sass-loader"] : [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader",  "sass-loader"]
			},


			// Angular templates
			{
				test: /\.html$/,
				use: {
					loader: 'file-loader',
					options: { name: isDev ? 'templates/[name].[ext]' : 'templates/[name].[hash:8].[ext]', esModule: false }
				}
			},
			
			// images & fonts loader
			{
				test: /\.(jpe?g|png|gif|webp|eot|ttf|woff|woff2|svg|)$/i,
				use: [
					{ loader: "url-loader", options: { limit: 1000, name: "assets/[name].[hash].[ext]" } }
				]
			}

		]
	},

	plugins: [

		// HTML outputs...
		new HtmlWebpackPlugin({
			inject: "head",
			filename: 'index.html',
			template: "!!raw-loader!./src/index.html"
		}
		),

		// BC: import jQuery to old plugins... ¯\_(ツ)_/¯
		new webpack.ProvidePlugin({
			"$": "jquery",
			"jquery": "jquery",
			"jQuery": "jquery",
			"window.$": "jquery",
			"window.jQuery": "jquery" // Angular 1.+
		}),

	]
		.concat(isHot ? [] : [
			// Extract CSS to file when is not HMR mode...
			new MiniCssExtractPlugin({
				filename: isDev ? 'css/[name].css' : 'css/[name].[contenthash].css',
				chunkFilename: 'css/[id].css'
			})
		])
		.concat(
			isDev ? [] : [
				// gzip results
				new CompressionPlugin({
					test: /\.(js|css|html)$/
				}),
			]
		),

	optimization: {
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: 'commons',
					chunks: 'all',
				},
			},
		},
	},

};

module.exports = app;