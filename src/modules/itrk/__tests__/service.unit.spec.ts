import medusaPackageJson from "@medusajs/medusa/package.json";
import pluginPackageJson from "../../../../package.json";

import {
  itrkPluginOptionsSchema,
  itrkPushPayloadSchema,
} from "../../../schemas";
import ItrkModuleService, { ItrkServiceError } from "../service";

describe("ItrkModuleService.handlePush", () => {
  it("creates a legal document and returns the configured literal target URL", async () => {
    const service = createService();

    await expect(service.handlePush(createPushPayload())).resolves.toEqual({
      targetUrl: "https://store.example/legal/terms-and-conditions",
    });

    expect(service.listLegalDocuments).toHaveBeenCalledWith(
      {
        sales_channel_id: "sc_123",
        document_type: "agb",
        language: "en",
        country: "DE",
      },
      { take: 1 },
    );
    expect(service.createLegalDocuments).toHaveBeenCalledWith({
      sales_channel_id: "sc_123",
      account_id: "account-1",
      document_type: "agb",
      title: "General Terms and Conditions",
      language: "en",
      country: "DE",
      text: "General Terms and Conditions",
      html: "<h1>General Terms and Conditions</h1>",
      target_url: "https://store.example/legal/terms-and-conditions",
      pdf_file_id: null,
      pdf_url: null,
      pdf_md5hash: null,
    });
    expect(service.updateLegalDocuments).not.toHaveBeenCalled();
  });

  it("updates an existing legal document for the same business key", async () => {
    const service = createService();

    service.listLegalDocuments.mockResolvedValue([
      {
        id: "ldoc_123",
      },
    ]);

    await expect(service.handlePush(createPushPayload())).resolves.toEqual({
      targetUrl: "https://store.example/legal/terms-and-conditions",
    });

    expect(service.createLegalDocuments).not.toHaveBeenCalled();
    expect(service.updateLegalDocuments).toHaveBeenCalledWith({
      id: "ldoc_123",
      sales_channel_id: "sc_123",
      account_id: "account-1",
      document_type: "agb",
      title: "General Terms and Conditions",
      language: "en",
      country: "DE",
      text: "General Terms and Conditions",
      html: "<h1>General Terms and Conditions</h1>",
      target_url: "https://store.example/legal/terms-and-conditions",
      pdf_file_id: null,
      pdf_url: null,
      pdf_md5hash: null,
    });
  });

  it("matches locale-style channel languages against push languages", async () => {
    const service = createService({
      channels: [
        {
          salesChannelId: "sc_123",
          accountId: "account-1",
          accountName: "Main Store",
          languages: ["de_DE", "en_GB"],
          countries: ["DE", "AT"],
          targetUrls: {
            agb: "https://store.example/legal/terms-and-conditions",
          },
        },
      ],
    });

    await expect(
      service.handlePush(
        createPushPayload({
          rechtstext_language: "de",
          rechtstext_language_iso639_2b: "ger",
          rechtstext_country: "DE",
        }),
      ),
    ).resolves.toEqual({
      targetUrl: "https://store.example/legal/terms-and-conditions",
    });
  });

  it("omits targetUrl when no literal URL is configured", async () => {
    const service = createService({
      channels: [
        {
          salesChannelId: "sc_123",
          accountId: "account-1",
          accountName: "Main Store",
          languages: ["en"],
          countries: ["DE", "AT"],
          targetUrls: {},
        },
      ],
    });

    await expect(service.handlePush(createPushPayload())).resolves.toEqual({});
    expect(service.createLegalDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        target_url: null,
      }),
    );
  });

  it("persists available PDF metadata", async () => {
    const service = createService();

    await service.handlePush(
      createPushPayload({
        rechtstext_pdf_url: "https://cdn.example.test/agb.pdf",
        rechtstext_pdf_md5hash: "abc123",
      }),
    );

    expect(service.createLegalDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        pdf_file_id: null,
        pdf_url: "https://cdn.example.test/agb.pdf",
        pdf_md5hash: "abc123",
      }),
    );
  });

  it("maps persistence failures to vendor code 50", async () => {
    const service = createService();

    service.createLegalDocuments.mockRejectedValue(new Error("boom"));

    await expect(service.handlePush(createPushPayload())).rejects.toMatchObject(
      {
        code: 50,
        message: "Document save failed",
      },
    );
  });

  it("throws vendor code 11 for an unknown account", async () => {
    const service = createService();

    await expect(
      service.handlePush(createPushPayload({ user_account_id: "missing" })),
    ).rejects.toBeInstanceOf(ItrkServiceError);

    await expectServiceErrorCode(
      async () =>
        service.handlePush(createPushPayload({ user_account_id: "missing" })),
      11,
    );
  });

  it("throws vendor code 82 for an unsupported language", async () => {
    const service = createService();

    await expectServiceErrorCode(
      async () =>
        service.handlePush(
          createPushPayload({
            rechtstext_language: "fr",
            rechtstext_language_iso639_2b: "fre",
          }),
        ),
      82,
    );
  });

  it("throws vendor code 17 for an unsupported country", async () => {
    const service = createService();

    await expectServiceErrorCode(
      async () =>
        service.handlePush(
          createPushPayload({
            rechtstext_country: "GB",
          }),
        ),
      17,
    );
  });

  it("uses the installed Medusa version for shopVersion", () => {
    const service = createService();

    expect(service.getVersions()).toMatchObject({
      shopVersion: medusaPackageJson.version,
      moduleVersion: pluginPackageJson.version,
    });
  });
});

function createService(overrides?: Record<string, unknown>) {
  const service = new ItrkModuleService(
    {},
    itrkPluginOptionsSchema.parse({
      token: "TEST_TOKEN",
      channels: [
        {
          salesChannelId: "sc_123",
          accountId: "account-1",
          accountName: "Main Store",
          languages: ["en"],
          countries: ["DE", "AT"],
          targetUrls: {
            agb: "https://store.example/legal/terms-and-conditions",
          },
        },
      ],
      ...overrides,
    }),
  ) as ItrkModuleService & {
    listLegalDocuments: jest.Mock;
    createLegalDocuments: jest.Mock;
    updateLegalDocuments: jest.Mock;
  };

  service.listLegalDocuments = jest.fn().mockResolvedValue([]);
  service.createLegalDocuments = jest
    .fn()
    .mockResolvedValue({ id: "ldoc_new" });
  service.updateLegalDocuments = jest.fn().mockResolvedValue({
    id: "ldoc_existing",
  });

  return service;
}

function createPushPayload(overrides?: Record<string, unknown>) {
  return itrkPushPayloadSchema.parse({
    api_version: "1.0",
    action: "push",
    user_auth_token: "TEST_TOKEN",
    user_account_id: "account-1",
    rechtstext_type: "agb",
    rechtstext_title: "General Terms and Conditions",
    rechtstext_country: "DE",
    rechtstext_language: "en",
    rechtstext_language_iso639_2b: "eng",
    rechtstext_text: "General Terms and Conditions",
    rechtstext_html: "<h1>General Terms and Conditions</h1>",
    ...overrides,
  });
}

async function expectServiceErrorCode(
  run: () => Promise<unknown>,
  code: number,
) {
  try {
    await run();
    throw new Error("Expected push handling to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(ItrkServiceError);
    expect((error as ItrkServiceError).code).toBe(code);
  }
}
