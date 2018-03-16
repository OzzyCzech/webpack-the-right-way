import path from "path";
import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CompressionPlugin from "compression-webpack-plugin";

const isHot = path.basename(require.main.filename) === "webpack-dev-server.js";
const isDev = isHot || process.argv.indexOf("development") !== -1; // detect --mode development


console.info("Webpack " + (isHot ? "running hot-reload sever" : "building output") + " in " + (isDev ? "DEVELOPMENT" : "PRODUCTION") + " mode");

const app = {

	entry: {
		app: "./src/app.js"
	},

	output: {
		path: path.resolve(__dirname, "./public/"),
		publicPath: isDev ? "http://localhost:5000/" : "/",
		filename: isDev ? "js/[name].js" : "js/[name].[chunkhash].js",
		chunkFilename: isDev ? "js/[name].js" : "js/[name].[chunkhash].js"
	},

	resolve: {
		modules: [path.resolve(__dirname, "src"), "node_modules"]
	},

	devServer: {
		contentBase: [path.join(__dirname, "public")],
		hot: true,
		compress: true,
		host: "localhost", // 0.0.0.0 || 127.0.0.1 || localhost || example.local
		overlay: {errors: true, warnings: true},
		port: 5000,
		noInfo: true,
	},

	// @see https://webpack.js.org/configuration/devtool/
	// in DEVELOPMENT mode is set to eval by default but we need maps also...
	devtool: isDev ? "cheap-eval-source-map" : false,

	module: {
		rules: [

			// JS
			{
				test: /\.js$/,
				exclude: /(node_modules)/,
				use: {loader: "babel-loader"},
			},

			// CSS
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader", "postcss-loader"
				]
			},

			// Angular HTML template loader
			{
				test: /\.html$/,
				use: {
					loader: "file-loader",
					options: {name: "partials/[name].[hash:8].[ext]"}
				}
			},

			// images & fonts loader
			{
				test: /\.(jpe?g|png|gif|webp|eot|ttf|woff|woff2|svg|)$/i,
				use: [
					{loader: "url-loader", options: {limit: 1000, name: "assets/[name].[hash].[ext]"}}
				]
			}

		]
	},

	plugins: [

		// Default HTML entry point index.html ...
		new HtmlWebpackPlugin({
					inject: "head",
					filename: "index.html",
					chunksSortMode: "dependency", // necessary to consistently work with multiple chunks via CommonsChunkPlugin
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

		/**
		 * Extract CSS into separate files
		 * FIXME change "chunkhash" to "contenthash" when it will be ready
		 * @see https://github.com/webpack-contrib/mini-css-extract-plugin/pull/30
		 */
		new MiniCssExtractPlugin({
			filename: isDev ? "css/[name].css" : "css/[name].[chunkhash].css",
			chunkFilename: "css/[name].css"
		})

	].concat(
			isDev ? [] : [
				// gzip results
				new CompressionPlugin({
					asset: "[path].gz[query]",
					algorithm: "gzip",
					test: /\.(js|css|html)$/
				}),
			]
	),

	/**
	 * Default setting is pretty decent right now
	 * @see https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a
	 */
	optimization: {
		// split node_modules chunks to vendor.js file
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: "vendor",
					chunks: "all",
				},
			},
		},
	},

};

module.exports = app;


