import type { Configuration } from 'webpack';

const isProd = process.env.NODE_ENV === 'production';

const config: Configuration = {
  entry: './src/renderer/renderer.tsx',
  target: 'web',
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              declaration: false,
              declarationMap: false,
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  optimization: {
    minimize: isProd,
  },
  devServer: {
    webSocketServer: {
      options: {
        port: 9000,
      },
    },
    client: {
      webSocketURL: 'ws://localhost:9001/ws',
      reconnect: false,
    },
  },
};

export default config;
