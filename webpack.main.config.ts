import type { Configuration } from 'webpack';

const config: Configuration = {
  entry: './src/main/main.ts',
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: {
    sharp: 'commonjs sharp',
    'electron-store': 'commonjs electron-store',
  },
};

export default config;
