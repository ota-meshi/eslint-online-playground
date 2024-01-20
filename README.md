# eslint-online-playground

[ESLint](https://eslint.org/) online playground.

This playground allows you to check the behavior in combination with the plugins.

## Examples

- [eslint-plugin-n](https://eslint-online-playground.netlify.app/#eslint-plugin-n)
- [eslint-plugin-eslint-plugin](https://eslint-online-playground.netlify.app/#eslint-plugin-eslint-plugin)
- [eslint-plugin-promise](https://eslint-online-playground.netlify.app/#eslint-plugin-promise)

## Contributing

### Add an example

Add an example to the directory below and submit a PR.

[src/examples](https://github.com/ota-meshi/eslint-online-playground/tree/main/src/examples)

### Add a plugin installer

Add a plugin to the directory below and submit a PR.

[src/plugins/plugins](https://github.com/ota-meshi/eslint-online-playground/tree/main/src/plugins/plugins)

## About

This playground works by calling ESLint in a Node.js process launched inside the browser using [WebContainers](https://webcontainers.io/).

It is [deployed to Netlify](https://eslint-online-playground.netlify.app/).

[![Netlify Status](https://api.netlify.com/api/v1/badges/2d9757d5-f0ac-4cd1-8b30-e1b9941edba4/deploy-status)](https://app.netlify.com/sites/eslint-online-playground/deploys)
