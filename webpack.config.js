const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const mode = process.env.NODE_ENV;

module.exports = {
	target: 'web',
	mode,
	entry: path.resolve(__dirname, 'src/TextTip.ts'),
	devtool: 'source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'babel-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{loader: 'css-loader', options: {sourceMap: true, url: false}}
				]
			}
		]
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: 'TextTip.css'
		})
	],
	resolve: {
		extensions: ['.ts', '.css']
	},
	output: {
		filename: mode === 'production' ? 'TextTip.min.js' : 'TextTip.js',
		library: 'TextTip',
		libraryExport: 'default',
		libraryTarget: 'umd'
	}
};
