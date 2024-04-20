const CopyPlugin = require("copy-webpack-plugin");
const { join } = require("path");
const { DefinePlugin } = require("webpack");

const BUILD_DIR = '.next';

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: BUILD_DIR,
  reactStrictMode: true,
  webpack: (config, options) => {
    config.plugins.push(
      new DefinePlugin({
        __PROJECT_BUILD_DIR: JSON.stringify(join(__dirname, BUILD_DIR)), // maybe rename to `__PROJECT_DIR`?
      })
    );
    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "./email-templates",
            to: "./server/email-templates",
          },
        ],
      })
    );
    return config;
  },
};

module.exports = nextConfig;
