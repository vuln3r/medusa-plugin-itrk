import type { z } from "@medusajs/framework/zod";

import { itrkPluginOptionsSchema } from "./schemas";

export { itrkPluginOptionsSchema };

export type ItrkPluginOptionsInput = z.input<typeof itrkPluginOptionsSchema>;
export type ItrkPluginOptions = z.infer<typeof itrkPluginOptionsSchema>;
