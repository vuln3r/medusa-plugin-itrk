import { XMLParser } from "fast-xml-parser";

import {
  itrkActionEnvelopeSchema,
  itrkIntegrationRequestSchema,
  type ItrkIntegrationRequest,
} from "../../../schemas";

const itrkXmlParser = new XMLParser({
  ignoreAttributes: true,
  ignoreDeclaration: true,
  removeNSPrefix: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  htmlEntities: true,
});

export class ItrkRequestValidationError extends Error {
  constructor(
    message: string,
    readonly code: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ItrkRequestValidationError";
  }
}

export function parseAndValidateItrkRequest(
  rawBody: unknown,
): ItrkIntegrationRequest {
  if (typeof rawBody !== "string" || rawBody.trim().length === 0) {
    throw new ItrkRequestValidationError("Missing XML request body", 12);
  }

  const parsedXml = parseItrkXmlBody(rawBody);
  if (!isRecord(parsedXml) || !isRecord(parsedXml.api)) {
    throw new ItrkRequestValidationError("Invalid ITRK request body", 12, {
      expected_root: "api",
    });
  }
  const apiBody = parsedXml.api;

  const envelopeResult = itrkActionEnvelopeSchema.safeParse(apiBody);

  if (!envelopeResult.success) {
    const code = getValidationErrorCode(
      envelopeResult.error.issues[0]?.path[0],
    );

    throw new ItrkRequestValidationError(
      "Invalid ITRK request envelope",
      code,
      envelopeResult.error.flatten(),
    );
  }

  const requestResult = itrkIntegrationRequestSchema.safeParse(apiBody);

  if (!requestResult.success) {
    const code = getValidationErrorCode(requestResult.error.issues[0]?.path[0]);

    throw new ItrkRequestValidationError(
      `Invalid ITRK ${envelopeResult.data.action} request`,
      code,
      requestResult.error.flatten(),
    );
  }

  return requestResult.data;
}

function parseItrkXmlBody(rawXml: string): unknown {
  try {
    return itrkXmlParser.parse(rawXml);
  } catch (error) {
    throw new ItrkRequestValidationError("Invalid XML request body", 12, {
      cause: error instanceof Error ? error.message : error,
    });
  }
}

function getValidationErrorCode(path: unknown): number {
  switch (path) {
    case "api_version":
      return 1;
    case "action":
      return 10;
    case "user_auth_token":
      return 3;
    case "user_account_id":
      return 11;
    case "rechtstext_type":
      return 4;
    case "rechtstext_text":
      return 5;
    case "rechtstext_html":
      return 6;
    case "rechtstext_language":
    case "rechtstext_language_iso639_2b":
      return 9;
    case "rechtstext_country":
      return 17;
    case "rechtstext_title":
      return 18;
    case "rechtstext_pdf":
    case "rechtstext_pdf_url":
      return 7;
    case "rechtstext_pdf_filenamebase_suggestion":
    case "rechtstext_pdf_filename_suggestion":
      return 8;
    case "rechtstext_pdf_localized_filenamebase_suggestion":
      return 19;
    default:
      return 12;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
