import { MedusaService } from "@medusajs/framework/utils";
import medusaPackageJson from "@medusajs/medusa/package.json";

import pluginPackageJson from "../../../package.json";
import LegalDocument from "./models/legal-document";
import type {
  ItrkDocumentType,
  ItrkPluginOptions,
  ItrkPushPayload,
} from "../../schemas";

type InjectedDependencies = Record<string, never>;
type ItrkResolvedOptions = ItrkPluginOptions & {
  shopVersion: string;
  moduleVersion: string;
};
type ItrkPushResult = {
  targetUrl?: string;
};
type PersistedLegalDocumentInput = {
  sales_channel_id: string;
  account_id: string;
  document_type: ItrkPushPayload["rechtstext_type"];
  title: string;
  language: string;
  country: string;
  text: string;
  html: string;
  target_url: string | null;
  pdf_file_id: string | null;
  pdf_url: string | null;
  pdf_md5hash: string | null;
};
type StoreDocumentLookup = {
  salesChannelId: string;
  documentType: ItrkDocumentType;
  language: string;
  country: string;
};
type ItrkLegalDocumentRecord = PersistedLegalDocumentInput & {
  id: string;
  created_at: Date | string;
  updated_at: Date | string;
};

export class ItrkServiceError extends Error {
  constructor(
    message: string,
    readonly code: number,
  ) {
    super(message);
    this.name = "ItrkServiceError";
  }
}

export default class ItrkModuleService extends MedusaService({
  LegalDocument,
}) {
  protected readonly options_: ItrkPluginOptions;
  protected readonly moduleVersion_: string = pluginPackageJson.version;
  protected readonly shopVersion_: string;

  constructor(deps: InjectedDependencies, options: ItrkPluginOptions) {
    super(deps);

    this.options_ = options;
    this.shopVersion_ = medusaPackageJson.version;
  }

  getOptions(): ItrkResolvedOptions {
    return {
      ...this.options_,
      shopVersion: this.shopVersion_,
      moduleVersion: this.moduleVersion_,
    };
  }

  getVersions() {
    return {
      shopVersion: this.shopVersion_,
      moduleVersion: this.moduleVersion_,
    };
  }

  authenticateToken(token: string) {
    return token === this.options_.token;
  }

  listAccounts() {
    return this.options_.channels.map((channel) => ({
      accountId: channel.accountId,
      accountName: channel.accountName,
      salesChannelId: channel.salesChannelId,
      languages: channel.languages,
      countries: channel.countries,
    }));
  }

  async handlePush(payload: ItrkPushPayload): Promise<ItrkPushResult> {
    const channel = this.options_.channels.find(
      (channel) => channel.accountId === payload.user_account_id,
    );

    if (!channel) {
      throw new ItrkServiceError("Unknown account ID", 11);
    }

    if (
      !this.channelSupportsLanguage(
        channel.languages,
        payload.rechtstext_language,
      )
    ) {
      throw new ItrkServiceError(
        "Language is not supported for this account",
        82,
      );
    }

    if (!channel.countries.includes(payload.rechtstext_country)) {
      throw new ItrkServiceError(
        "Country is not supported for this account",
        17,
      );
    }

    const targetUrl = channel.targetUrls[payload.rechtstext_type] ?? null;

    await this.upsertLegalDocument(
      this.buildLegalDocumentPayload(payload, channel, targetUrl),
    );

    if (!targetUrl) {
      return {};
    }

    return {
      targetUrl,
    };
  }

  async getStoreDocument(
    lookup: StoreDocumentLookup,
  ): Promise<ItrkLegalDocumentRecord | null> {
    const [document] = await this.listLegalDocuments(
      {
        sales_channel_id: lookup.salesChannelId,
        document_type: lookup.documentType,
        language: lookup.language,
        country: lookup.country,
      },
      {
        take: 1,
      },
    );

    return (document as ItrkLegalDocumentRecord | undefined) ?? null;
  }

  private async upsertLegalDocument(
    legalDocument: PersistedLegalDocumentInput,
  ): Promise<void> {
    try {
      const [existingDocument] = await this.listLegalDocuments(
        this.getLegalDocumentLookupKey(legalDocument),
        {
          take: 1,
        },
      );

      if (existingDocument) {
        await this.updateLegalDocuments({
          id: existingDocument.id,
          ...legalDocument,
        });

        return;
      }

      await this.createLegalDocuments(legalDocument);
    } catch {
      throw new ItrkServiceError("Document save failed", 50);
    }
  }

  private getLegalDocumentLookupKey(
    legalDocument: Pick<
      PersistedLegalDocumentInput,
      "sales_channel_id" | "document_type" | "language" | "country"
    >,
  ) {
    return {
      sales_channel_id: legalDocument.sales_channel_id,
      document_type: legalDocument.document_type,
      language: legalDocument.language,
      country: legalDocument.country,
    };
  }

  private buildLegalDocumentPayload(
    payload: ItrkPushPayload,
    channel: ItrkPluginOptions["channels"][number],
    targetUrl: string | null,
  ): PersistedLegalDocumentInput {
    return {
      sales_channel_id: channel.salesChannelId,
      account_id: channel.accountId,
      document_type: payload.rechtstext_type,
      title: payload.rechtstext_title,
      language: payload.rechtstext_language,
      country: payload.rechtstext_country,
      text: payload.rechtstext_text,
      html: payload.rechtstext_html,
      target_url: targetUrl,
      pdf_file_id: null,
      pdf_url: payload.rechtstext_pdf_url ?? null,
      pdf_md5hash: payload.rechtstext_pdf_md5hash ?? null,
    };
  }

  private channelSupportsLanguage(languages: string[], language: string) {
    return languages.some((candidate) => {
      const normalizedCandidate = candidate.trim().toLowerCase();

      return (
        normalizedCandidate === language ||
        normalizedCandidate.startsWith(`${language}_`) ||
        normalizedCandidate.startsWith(`${language}-`)
      );
    });
  }
}
