import path from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/main.ts',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist/assets'),
    publicPath: '/assets/',
  },
  devServer: {
    client: {
      overlay: { errors: true, warnings: false }, // show only errors on the overlay
    },
    static: [
      { directory: path.join(__dirname, 'public') },
      { directory: path.join(__dirname, 'dist') },
    ],
    port: 5173,
    host: '0.0.0.0',
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://api:8080',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: 'localhost',
      },
    ],
  },
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
      {
        test: /\.s?css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              api: 'modern',
              sassOptions: {
                loadPaths: [path.join(__dirname, 'node_modules')],
                quietDeps: true,
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      __GOOGLE_CLIENT_ID__: JSON.stringify(
        process.env.GOOGLE_CLIENT_ID || 'MISSING_GOOGLE_CLIENT_ID',
      ),
    }),
  ],
};
