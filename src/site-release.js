// Enable indexing only after the approved pages have been deployed at this origin.
// This does not deploy anything or turn the local server into a Shopify theme.
export const siteRelease = Object.freeze({
  indexingEnabled: false,
  publicOrigin: 'https://next-jump-outfitters.diegoafmejia111.chatgpt.site',
  indexablePaths: [],
  socialImage: '/images/share-next-jump.png',
  socialImageAlt: 'Next Jump Outfitters — aluminum flatbeds and off-road upgrades in Tacoma.',
});
