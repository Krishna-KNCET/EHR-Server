const path = require('path');

module.exports = {
  entry: './src/index.jsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    historyApiFallback: true,
    port: 3000,
    proxy: {
      '/api': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
      '/uploads': 'http://localhost:4000'
    },
  },
  module: {
    rules: [
      { test: /\.jsx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env', '@babel/preset-react'] } } },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  resolve: { extensions: ['.js', '.jsx'] },
};
