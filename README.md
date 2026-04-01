# @sadu/medusa-plugin-itrk

`@sadu/medusa-plugin-itrk` is a Medusa v2 plugin for receiving IT-Recht Kanzlei XML pushes, storing the latest legal-document variant per sales channel and locale, and exposing those documents through a store API.

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
pnpm add @sadu/medusa-plugin-itrk
```

Then register the plugin in `medusa-config.ts`:

```ts
import { defineConfig } from "@medusajs/framework/utils"
import type { ItrkPluginOptionsInput } from "@sadu/medusa-plugin-itrk/types"

export default defineConfig({
  plugins: [
    {
      resolve: "@sadu/medusa-plugin-itrk",
      options: {
        token: "your-itrk-token",
        shopVersion: "1.0.0",
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

## Exported types

- `@sadu/medusa-plugin-itrk`
- `@sadu/medusa-plugin-itrk/types`

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
