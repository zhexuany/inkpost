import type { Configuration } from 'webpack';

const config: Configuration = {
  entry: './src/renderer/renderer.tsx',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: 'ts-loader',
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
  devServer: {
    webSocketServer: {
      options: {
        port: 9000,
      },
    },
    client: {
      webSocketURL: 'ws://localhost:9001/ws',
    },
  },
};

export default config;
