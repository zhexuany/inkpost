import path from 'path';
import type { Configuration } from 'webpack';

const isProd = process.env.NODE_ENV === 'production';

const config: Configuration = {
  entry: './src/main/main.ts',
  target: 'electron-main',
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
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
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  externals: {
    sharp: 'commonjs sharp',
    'electron-store': 'commonjs electron-store',
    'mathjax-node': 'commonjs mathjax-node',
  },
  optimization: {
    minimize: isProd,
  },
};

export default config;
