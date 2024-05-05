// see https://webpack.js.org/guides/typescript/#importing-other-assets
// see https://webpack.js.org/guides/asset-modules/#source-assets
declare module "*.mjml" {
  const content: string;
  export default content;
}
