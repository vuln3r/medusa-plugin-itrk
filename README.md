# @sadu-dev/medusa-plugin-itrk

[![npm version](https://img.shields.io/npm/v/%40sadu-dev%2Fmedusa-plugin-itrk)](https://www.npmjs.com/package/@sadu-dev/medusa-plugin-itrk)
[![npm downloads](https://img.shields.io/npm/dm/%40sadu-dev%2Fmedusa-plugin-itrk)](https://www.npmjs.com/package/@sadu-dev/medusa-plugin-itrk)
[![publish workflow](https://github.com/vuln3r/medusa-plugin-itrk/actions/workflows/publish-npm.yml/badge.svg)](https://github.com/vuln3r/medusa-plugin-itrk/actions/workflows/publish-npm.yml)
[![node](https://img.shields.io/node/v/%40sadu-dev%2Fmedusa-plugin-itrk)](https://nodejs.org/)
[![license](https://img.shields.io/npm/l/%40sadu-dev%2Fmedusa-plugin-itrk)](LICENSE)

`@sadu-dev/medusa-plugin-itrk` is a Medusa v2 plugin that keeps your storefront legal pages in sync with updates from IT-Recht Kanzlei (`https://www.it-recht-kanzlei.de/`), a German legal content provider for ecommerce shops.

In practice, the plugin accepts IT-Recht Kanzlei XML updates, stores the latest document version per sales channel and language, and serves those documents through a store API so your frontend can always show current legal texts (for example terms and conditions, privacy policy, imprint, and withdrawal information).

Maintained by `SADU Development e.U.` at `https://sadu.at`.

## Compatibility

- Node.js `>=20`
- Medusa packages `>=2.12.0 <3`

## What it includes

- `POST /integrations/itrk` for ITRK XML requests
- `GET /store/itrk/:doc_type` for storefront document retrieval
- A dedicated `itrk` module with persisted legal-document records
- Medusa plugin option validation via exported Zod schema

## Install

```bash
pnpm add @sadu-dev/medusa-plugin-itrk
```

Then register the plugin in your Medusa backend's `medusa-config.ts` file at the project root (`<your-medusa-project>/medusa-config.ts`):

```ts
import { defineConfig } from "@medusajs/framework/utils"
import type { ItrkPluginOptionsInput } from "@sadu-dev/medusa-plugin-itrk/types"

export default defineConfig({
  plugins: [
    {
      resolve: "@sadu-dev/medusa-plugin-itrk",
      options: {
        token: "your-itrk-token",
        channels: [
          {
            salesChannelId: "sc_...",
            accountId: "account-1",
            accountName: "Main Store",
            languages: ["de", "en"],
            countries: ["DE", "AT"],
            targetUrls: {
              agb: "https://store.example/legal/agb",
              datenschutz: "https://store.example/legal/privacy",
              impressum: "https://store.example/legal/imprint",
              widerruf: "https://store.example/legal/withdrawal",
            },
          },
        ],
      } satisfies ItrkPluginOptionsInput,
    },
  ],
})
```

`meta_shopversion` is derived automatically from the installed `@medusajs/medusa` version.

Choose the `token` value yourself and enter the same value in both Medusa and IT-Recht Kanzlei. IT-Recht Kanzlei does not issue or generate this token for you.

## IT-Recht Kanzlei Setup

When configuring the API URL in IT-Recht Kanzlei, enter only your Medusa backend base URL.

Do not append `/integrations/itrk` manually.

## Exported types

- `@sadu-dev/medusa-plugin-itrk`
- `@sadu-dev/medusa-plugin-itrk/types`

The package exports `itrkPluginOptionsSchema`, `ItrkPluginOptions`, and `ItrkPluginOptionsInput`.

## Development

```bash
pnpm build
pnpm lint
pnpm test:unit
```

## Publishing

The package is built with Medusa's plugin build command before publish:

```bash
pnpm build
npm publish
```

The published package contains the built `.medusa/server` output and package metadata only.

## License

MIT
