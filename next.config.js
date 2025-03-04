const { join } = require("path");
const { DefinePlugin, NormalModuleReplacementPlugin } = require("webpack");

const IS_DEMO_MODE = process.env.IS_DEMO_MODE === "true" || false;
const BUILD_DIR = ".next";
const DEMO_MODE_REDIRECT = [{
  source: "/auth/:x",
  destination: "/calendar",
  permanent: true,
}];

/** @type {import('next').NextConfig} */
const nextConfig = {
  redirects: async () => [
    ...(IS_DEMO_MODE ? DEMO_MODE_REDIRECT : []),
    {
      source: "/",
      destination: "/calendar",
      permanent: true,
    },
  ],
  distDir: BUILD_DIR,
  reactStrictMode: true,
  webpack: (config, options) => {
    // in demo mode, swap the frontend `api.service.ts` with `demo-api.service.ts`
    if (IS_DEMO_MODE) {
      config.plugins.push(
        new NormalModuleReplacementPlugin(
          /services\/api\.service/,
          (resource) => {
            resource.request = resource.request.replace(
              "api.service",
              "demo-api.service"
            );
            if (resource.createData) {
              resource.createData.request = resource.request;
            }
          }
        )
      );
    }
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
