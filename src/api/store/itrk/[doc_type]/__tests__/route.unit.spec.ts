import { MedusaError } from "@medusajs/framework/utils";

import { GET } from "../route";
import { ITRK_MODULE } from "../../../../../modules/itrk";

describe("GET /store/itrk/[doc_type]", () => {
  it("returns the requested legal document", async () => {
    const itrkService = {
      getStoreDocument: jest.fn().mockResolvedValue({
        document_type: "agb",
        sales_channel_id: "sc_123",
        language: "en",
        country: "US",
        title: "Terms and Conditions",
        html: "<p>HTML</p>",
        text: "Text",
        target_url: "https://example.com/agb",
        pdf_file_id: "file_123",
        pdf_url: "https://cdn.example.com/agb.pdf",
        pdf_md5hash: "deadbeef",
        created_at: "2026-04-01T10:00:00.000Z",
        updated_at: "2026-04-02T11:00:00.000Z",
      }),
    };
    const req = {
      params: {
        doc_type: "agb",
      },
      query: {
        sales_channel_id: "sc_123",
        country: "us",
        language: "EN",
      },
      publishable_key_context: {
        sales_channel_ids: ["sc_123"],
      },
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - mocked Medusa request/response
    await GET(req, res);

    expect(req.scope.resolve).toHaveBeenCalledWith(ITRK_MODULE);
    expect(itrkService.getStoreDocument).toHaveBeenCalledWith({
      salesChannelId: "sc_123",
      documentType: "agb",
      language: "en",
      country: "US",
    });
    expect(res.json).toHaveBeenCalledWith({
      doc_type: "agb",
      sales_channel_id: "sc_123",
      language: "en",
      country: "US",
      title: "Terms and Conditions",
      html: "<p>HTML</p>",
      text: "Text",
      pdf: {
        id: "file_123",
        url: "https://cdn.example.com/agb.pdf",
        md5hash: "deadbeef",
      },
      target_url: "https://example.com/agb",
      published_at: "2026-04-01T10:00:00.000Z",
      updated_at: "2026-04-02T11:00:00.000Z",
    });
  });

  it("returns the requested document without pdf metadata", async () => {
    const itrkService = {
      getStoreDocument: jest.fn().mockResolvedValue({
        document_type: "impressum",
        sales_channel_id: "sc_123",
        language: "fr",
        country: "CA",
        title: "Mentions legales",
        html: "<p>HTML</p>",
        text: "Texte",
        target_url: "https://example.com/impressum",
        pdf_file_id: null,
        pdf_url: null,
        pdf_md5hash: null,
        created_at: "2026-04-01T10:00:00.000Z",
        updated_at: "2026-04-02T11:00:00.000Z",
      }),
    };
    const req = {
      params: {
        doc_type: "impressum",
      },
      query: {
        sales_channel_id: "sc_123",
        country: "ca",
        language: "fr",
      },
      publishable_key_context: {
        sales_channel_ids: ["sc_123"],
      },
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - mocked Medusa request/response
    await GET(req, res);

    expect(itrkService.getStoreDocument).toHaveBeenCalledWith({
      salesChannelId: "sc_123",
      documentType: "impressum",
      language: "fr",
      country: "CA",
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        pdf: null,
        published_at: "2026-04-01T10:00:00.000Z",
      }),
    );
  });

  it("rejects requests without scoped sales channels", async () => {
    const req = {
      params: {
        doc_type: "agb",
      },
      query: {
        sales_channel_id: "sc_123",
        country: "US",
        language: "en",
      },
      publishable_key_context: {
        sales_channel_ids: [],
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - mocked Medusa request/response
    await expect(GET(req, res)).rejects.toMatchObject({
      type: MedusaError.Types.INVALID_DATA,
      message:
        "At least one sales channel ID is required to be associated with the publishable API key in the request header.",
    });
  });

  it("rejects requests for a sales channel outside the publishable key scope", async () => {
    const itrkService = {
      getStoreDocument: jest.fn(),
    };
    const req = {
      params: {
        doc_type: "agb",
      },
      query: {
        sales_channel_id: "sc_999",
        country: "US",
        language: "en",
      },
      publishable_key_context: {
        sales_channel_ids: ["sc_123"],
      },
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - mocked Medusa request/response
    await expect(GET(req, res)).rejects.toMatchObject({
      type: MedusaError.Types.INVALID_DATA,
      message:
        "Requested sales channel is not associated with the publishable API key.",
    });
    expect(itrkService.getStoreDocument).not.toHaveBeenCalled();
  });

  it("rejects requests when language can not be resolved", async () => {
    const itrkService = {
      getStoreDocument: jest.fn(),
    };
    const req = {
      params: {
        doc_type: "agb",
      },
      query: {
        sales_channel_id: "sc_123",
        country: "US",
      },
      publishable_key_context: {
        sales_channel_ids: ["sc_123"],
      },
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - mocked Medusa request/response
    await expect(GET(req, res)).rejects.toMatchObject({
      type: MedusaError.Types.INVALID_DATA,
      message: "Language is required in the query or request locale.",
    });
    expect(itrkService.getStoreDocument).not.toHaveBeenCalled();
  });

  it("rejects invalid document types", async () => {
    const req = {
      params: {
        doc_type: "AGB",
      },
      query: {
        sales_channel_id: "sc_123",
        country: "US",
        language: "en",
      },
      publishable_key_context: {
        sales_channel_ids: ["sc_123"],
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - mocked Medusa request/response
    await expect(GET(req, res)).rejects.toMatchObject({
      type: MedusaError.Types.INVALID_DATA,
    });
  });

  it("rejects when no matching document exists", async () => {
    const itrkService = {
      getStoreDocument: jest.fn().mockResolvedValue(null),
    };
    const req = {
      params: {
        doc_type: "agb",
      },
      query: {
        sales_channel_id: "sc_123",
        country: "US",
        language: "en",
      },
      publishable_key_context: {
        sales_channel_ids: ["sc_123"],
      },
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - mocked Medusa request/response
    await expect(GET(req, res)).rejects.toMatchObject({
      type: MedusaError.Types.NOT_FOUND,
      message: "No ITRK legal document found for the requested criteria.",
    });
  });
});

function createMockResponse() {
  return {
    json: jest.fn(),
  };
}
