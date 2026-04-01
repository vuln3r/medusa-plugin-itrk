import {
  MedusaResponse,
  type MedusaStoreRequest,
} from "@medusajs/framework/http";
import { MedusaError } from "@medusajs/framework/utils";

import { ITRK_MODULE } from "../../../../modules/itrk";
import type ItrkModuleService from "../../../../modules/itrk/service";
import {
  storeItrkParamsSchema,
  storeItrkQuerySchema,
} from "../../../../schemas";

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const salesChannelIds = req.publishable_key_context?.sales_channel_ids ?? [];

  if (!salesChannelIds.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "At least one sales channel ID is required to be associated with the publishable API key in the request header.",
    );
  }

  const { docType, query } = parseStoreRequest(req);

  if (!salesChannelIds.includes(query.sales_channel_id)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Requested sales channel is not associated with the publishable API key.",
    );
  }

  if (!query.language) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Language is required in the query or request locale.",
    );
  }

  const itrkService = req.scope.resolve<ItrkModuleService>(ITRK_MODULE);
  const document = await itrkService.getStoreDocument({
    salesChannelId: query.sales_channel_id,
    documentType: docType,
    language: query.language,
    country: query.country,
  });

  if (!document) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No ITRK legal document found for the requested criteria.",
    );
  }

  return res.json({
    doc_type: document.document_type,
    sales_channel_id: document.sales_channel_id,
    language: document.language,
    country: document.country,
    title: document.title,
    html: document.html,
    text: document.text,
    pdf: buildPdfPayload(document),
    target_url: document.target_url,
    published_at: document.created_at,
    updated_at: document.updated_at,
  });
}

function parseStoreRequest(req: MedusaStoreRequest) {
  const paramsResult = storeItrkParamsSchema.safeParse({
    doc_type: req.params.doc_type,
  });

  if (!paramsResult.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid ITRK document type: ${formatIssues(paramsResult.error.issues)}`,
    );
  }

  const queryResult = storeItrkQuerySchema.safeParse({
    sales_channel_id: req.query.sales_channel_id,
    country: req.query.country,
    language: req.query.language,
  });

  if (!queryResult.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid ITRK store query: ${formatIssues(queryResult.error.issues)}`,
    );
  }

  return {
    docType: paramsResult.data.doc_type,
    query: queryResult.data,
  };
}

function formatIssues(
  issues: { path: (string | number)[]; message: string }[],
) {
  return issues
    .map((issue) => {
      const path = issue.path.join(".");

      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(", ");
}

function buildPdfPayload(document: {
  pdf_file_id: string | null;
  pdf_url: string | null;
  pdf_md5hash: string | null;
}) {
  if (!document.pdf_file_id && !document.pdf_url && !document.pdf_md5hash) {
    return null;
  }

  return {
    id: document.pdf_file_id,
    url: document.pdf_url,
    md5hash: document.pdf_md5hash,
  };
}
