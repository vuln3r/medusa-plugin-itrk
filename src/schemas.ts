import { z } from "@medusajs/framework/zod";

const nonEmptyStringSchema = z
  .string()
  .refine((value) => value.trim().length > 0);
const nonEmptyTrimmedStringSchema = z.string().trim().min(1);
const countryCodeSchema = z
  .string()
  .trim()
  .length(2)
  .transform((value) => value.toUpperCase());
const channelLanguageSchema = z.string().trim().min(2);
const languageCodeSchema = z
  .string()
  .trim()
  .min(2)
  .transform((value) => value.toLowerCase());
const urlSchema = z.string().trim().url();
const optionalNonEmptyStringSchema = nonEmptyStringSchema.optional();
const optionalNonEmptyTrimmedStringSchema =
  nonEmptyTrimmedStringSchema.optional();
const optionalUrlSchema = urlSchema.optional();
const apiVersionSchema = z
  .string()
  .trim()
  .refine((value) => value === "1.0");

const documentTypeSchema = z.enum([
  "impressum",
  "agb",
  "datenschutz",
  "widerruf",
]);

const itrkActionSchema = z.enum(["getversion", "getaccountlist", "push"]);

const targetUrlsSchema = z
  .object({
    impressum: optionalNonEmptyTrimmedStringSchema,
    agb: optionalNonEmptyTrimmedStringSchema,
    datenschutz: optionalNonEmptyTrimmedStringSchema,
    widerruf: optionalNonEmptyTrimmedStringSchema,
  })
  .default({});

export const itrkChannelSchema = z
  .object({
    salesChannelId: nonEmptyTrimmedStringSchema,
    accountId: nonEmptyTrimmedStringSchema,
    accountName: z.string().trim().default(""),
    languages: z.array(channelLanguageSchema).min(1),
    countries: z.array(countryCodeSchema).min(1),
    targetUrls: targetUrlsSchema,
  })
  .superRefine((channel, ctx) => {
    if (channel.accountId !== "0" && channel.accountName.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Account name is required unless accountId is '0'",
        path: ["accountName"],
      });
    }
  });

export const itrkPluginOptionsSchema = z.object({
  token: nonEmptyTrimmedStringSchema,
  shopVersion: nonEmptyTrimmedStringSchema,
  channels: z.array(itrkChannelSchema).min(1),
});

export const itrkActionEnvelopeSchema = z.object({
  api_version: apiVersionSchema,
  action: itrkActionSchema,
  user_auth_token: nonEmptyTrimmedStringSchema,
});

export const itrkGetVersionSchema = itrkActionEnvelopeSchema.extend({
  action: z.literal("getversion"),
});

export const itrkGetAccountListSchema = itrkActionEnvelopeSchema.extend({
  action: z.literal("getaccountlist"),
});

export const itrkPushPayloadSchema = itrkActionEnvelopeSchema.extend({
  action: z.literal("push"),
  user_account_id: nonEmptyTrimmedStringSchema,
  rechtstext_type: documentTypeSchema,
  rechtstext_title: nonEmptyTrimmedStringSchema,
  rechtstext_country: countryCodeSchema,
  rechtstext_language: languageCodeSchema,
  rechtstext_language_iso639_2b: z
    .string()
    .trim()
    .length(3)
    .transform((value) => value.toLowerCase()),
  rechtstext_text: nonEmptyStringSchema,
  rechtstext_html: nonEmptyStringSchema,
  rechtstext_pdf_filenamebase_suggestion: optionalNonEmptyTrimmedStringSchema,
  rechtstext_pdf_filename_suggestion: optionalNonEmptyTrimmedStringSchema,
  rechtstext_pdf_localized_filenamebase_suggestion:
    optionalNonEmptyTrimmedStringSchema,
  rechtstext_pdf_url: optionalUrlSchema,
  rechtstext_pdf: optionalNonEmptyStringSchema,
  rechtstext_pdf_md5hash: optionalNonEmptyTrimmedStringSchema,
});

export const itrkIntegrationRequestSchema = z.discriminatedUnion("action", [
  itrkGetVersionSchema,
  itrkGetAccountListSchema,
  itrkPushPayloadSchema,
]);

export const storeItrkQuerySchema = z.object({
  sales_channel_id: nonEmptyTrimmedStringSchema,
  country: countryCodeSchema,
  language: languageCodeSchema.optional(),
});

export const storeItrkParamsSchema = z.object({
  doc_type: documentTypeSchema,
});

export type ItrkDocumentType = z.infer<typeof documentTypeSchema>;
export type ItrkAction = z.infer<typeof itrkActionSchema>;
export type ItrkChannel = z.infer<typeof itrkChannelSchema>;
export type ItrkPluginOptions = z.infer<typeof itrkPluginOptionsSchema>;
export type ItrkActionEnvelope = z.infer<typeof itrkActionEnvelopeSchema>;
export type ItrkGetVersionRequest = z.infer<typeof itrkGetVersionSchema>;
export type ItrkGetAccountListRequest = z.infer<
  typeof itrkGetAccountListSchema
>;
export type ItrkPushPayload = z.infer<typeof itrkPushPayloadSchema>;
export type ItrkIntegrationRequest = z.infer<
  typeof itrkIntegrationRequestSchema
>;
export type StoreItrkQuery = z.infer<typeof storeItrkQuerySchema>;
export type StoreItrkParams = z.infer<typeof storeItrkParamsSchema>;
