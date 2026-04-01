import type { LoaderOptions } from "@medusajs/framework/types";
import { MedusaError } from "@medusajs/framework/utils";

import {
  itrkPluginOptionsSchema,
  type ItrkPluginOptions,
} from "../../../schemas";

export default async function validateOptionsLoader({
  options,
}: LoaderOptions<ItrkPluginOptions>) {
  const result = itrkPluginOptionsSchema.safeParse(options);

  if (!result.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid ITRK module options: ${result.error.issues
        .map((issue) => {
          const path = issue.path.join(".");

          return path ? `${path}: ${issue.message}` : issue.message;
        })
        .join(", ")}`,
    );
  }
}
