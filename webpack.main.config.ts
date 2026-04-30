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
