const { join } = require("path");
const { DefinePlugin } = require("webpack");

const BUILD_DIR = ".next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => [
    {
      source: "/",
      destination: "/calendar",
      permanent: true,
    },
  ],
  distDir: BUILD_DIR,
  reactStrictMode: true,
  webpack: (config, options) => {
    config.plugins.push(
      new DefinePlugin({
        __PROJECT_BUILD_DIR: JSON.stringify(join(__dirname, BUILD_DIR)), // maybe rename to `__PROJECT_DIR`?
      })
    );
    config.module.rules.push({
      test: /\.mjml/,
      type: "asset/source",
    });
    return config;
  },
};

module.exports = nextConfig;
