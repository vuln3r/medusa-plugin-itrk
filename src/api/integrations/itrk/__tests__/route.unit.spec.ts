import { POST } from "../route";
import { ITRK_MODULE } from "../../../../modules/itrk";
import { ItrkServiceError } from "../../../../modules/itrk/service";

type MockRes = {
  status: jest.Mock;
  set: jest.Mock;
  send: jest.Mock;
  json: jest.Mock;
};

describe("POST /integrations/itrk", () => {
  it("returns an XML error for an invalid token", async () => {
    const itrkService = {
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
      authenticateToken: jest.fn().mockReturnValue(false),
    };
    const req = {
      body: getVersionXml,
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(req.scope.resolve).toHaveBeenCalledWith(ITRK_MODULE);
    expect(itrkService.authenticateToken).toHaveBeenCalledWith("EXAMPLE_TOKEN");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith(
      "Content-Type",
      "text/xml; charset=utf-8",
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<status>error</status>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<error>3</error>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<meta_shopversion>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<error_message>Invalid token</error_message>"),
    );
  });

  it("returns an XML error for invalid XML", async () => {
    const itrkService = {
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
    };
    const req = {
      body: "<api",
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(req.scope.resolve).toHaveBeenCalledWith(ITRK_MODULE);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith(
      "Content-Type",
      "text/xml; charset=utf-8",
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<status>error</status>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<error>12</error>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining(
        "<error_message>Invalid XML request body</error_message>",
      ),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<meta_shopversion>1.0.0</meta_shopversion>"),
    );
  });

  it("returns an XML error when no XML body is provided", async () => {
    const itrkService = {
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
    };
    const req = {
      body: "",
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<error>12</error>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining(
        "<error_message>Missing XML request body</error_message>",
      ),
    );
  });

  it("returns vendor error code 10 for an invalid action", async () => {
    const itrkService = {
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
    };
    const req = {
      body: invalidActionXml,
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<error>10</error>"),
    );
  });

  it("returns vendor error code 18 for a missing title", async () => {
    const itrkService = {
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
    };
    const req = {
      body: pushMissingTitleXml,
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<error>18</error>"),
    );
  });

  it("returns an XML error for unexpected exceptions", async () => {
    const itrkService = {
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
      authenticateToken: jest.fn(() => {
        throw new Error("boom");
      }),
    };
    const req = {
      body: getVersionXml,
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith(
      "Content-Type",
      "text/xml; charset=utf-8",
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<status>error</status>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<error>99</error>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<error_message>Unknown error</error_message>"),
    );
  });

  it("returns an XML success response for getversion", async () => {
    const itrkService = {
      authenticateToken: jest.fn().mockReturnValue(true),
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
    };
    const req = {
      body: getVersionXml,
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(itrkService.getVersions).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith(
      "Content-Type",
      "text/xml; charset=utf-8",
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<status>success</status>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<meta_shopversion>1.0.0</meta_shopversion>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<meta_modulversion>0.0.1</meta_modulversion>"),
    );
    expect(res.json).not.toHaveBeenCalled();
  });

  it("returns an XML success response for getaccountlist", async () => {
    const itrkService = {
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
      authenticateToken: jest.fn().mockReturnValue(true),
      listAccounts: jest.fn().mockReturnValue([
        {
          accountId: "account-1",
          accountName: "Main Account",
          salesChannelId: "sc_123",
          languages: ["de", "en"],
          countries: ["DE", "AT"],
        },
      ]),
    };
    const req = {
      body: getAccountListXml,
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(itrkService.listAccounts).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith(
      "Content-Type",
      "text/xml; charset=utf-8",
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<status>success</status>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<accountid>account-1</accountid>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<accountname>Main Account</accountname>"),
    );
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("<locales>"));
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<locale>de</locale>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<locale>en</locale>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<country>DE</country>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<country>AT</country>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.not.stringContaining("<accounts>"),
    );
    expect(res.json).not.toHaveBeenCalled();
  });

  it("returns an XML success response for push", async () => {
    const itrkService = {
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
      authenticateToken: jest.fn().mockReturnValue(true),
      handlePush: jest.fn().mockReturnValue({
        targetUrl: "https://store.example/legal/terms-and-conditions",
      }),
    };
    const req = {
      body: pushXml,
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(itrkService.handlePush).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "push",
        user_account_id: "account-1",
        rechtstext_type: "agb",
      }),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<status>success</status>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining(
        "<target_url>https://store.example/legal/terms-and-conditions</target_url>",
      ),
    );
  });

  it("returns an XML error when push handling fails", async () => {
    const itrkService = {
      getVersions: jest.fn().mockReturnValue({
        shopVersion: "1.0.0",
        moduleVersion: "0.0.1",
      }),
      authenticateToken: jest.fn().mockReturnValue(true),
      handlePush: jest.fn(() => {
        throw new ItrkServiceError("Unknown account ID", 11);
      }),
    };
    const req = {
      body: pushXml,
      scope: {
        resolve: jest.fn().mockReturnValue(itrkService),
      },
    };
    const res = createMockResponse();

    // @ts-expect-error - we're intentionally passing a mocked request and response here
    await POST(req, res);

    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<status>error</status>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining("<error>11</error>"),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining(
        "<error_message>Unknown account ID</error_message>",
      ),
    );
  });
});

function createMockResponse(): MockRes {
  const res: MockRes = {
    status: jest.fn(),
    set: jest.fn(),
    send: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.set.mockReturnValue(res);
  res.send.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

const getVersionXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<api>
    <api_version>1.0</api_version>
    <user_auth_token>EXAMPLE_TOKEN</user_auth_token>
    <action>getversion</action>
</api>`;

const getAccountListXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<api>
    <api_version>1.0</api_version>
    <user_auth_token>EXAMPLE_TOKEN</user_auth_token>
    <action>getaccountlist</action>
</api>`;

const invalidActionXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<api>
    <api_version>1.0</api_version>
    <user_auth_token>EXAMPLE_TOKEN</user_auth_token>
    <action>pushh</action>
</api>`;

const pushMissingTitleXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<api>
    <api_version>1.0</api_version>
    <action>push</action>
    <user_auth_token>EXAMPLE_TOKEN</user_auth_token>
    <user_account_id>sc-id-01</user_account_id>
    <rechtstext_type>agb</rechtstext_type>
    <rechtstext_country>DE</rechtstext_country>
    <rechtstext_language>en</rechtstext_language>
    <rechtstext_language_iso639_2b>eng</rechtstext_language_iso639_2b>
    <rechtstext_text>General Terms and Conditions</rechtstext_text>
    <rechtstext_html>&lt;h1&gt;General Terms and Conditions&lt;/h1&gt;</rechtstext_html>
</api>`;

const pushXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<api>
    <api_version>1.0</api_version>
    <action>push</action>
    <user_auth_token>EXAMPLE_TOKEN</user_auth_token>
    <user_account_id>account-1</user_account_id>
    <rechtstext_type>agb</rechtstext_type>
    <rechtstext_type_ucase>AGB</rechtstext_type_ucase>
    <rechtstext_title>General Terms and Conditions</rechtstext_title>
    <rechtstext_country>DE</rechtstext_country>
    <rechtstext_language>en</rechtstext_language>
    <rechtstext_language_iso639_2b>eng</rechtstext_language_iso639_2b>
    <rechtstext_text>General Terms and Conditions</rechtstext_text>
    <rechtstext_html>&lt;h1&gt;General Terms and Conditions&lt;/h1&gt;</rechtstext_html>
</api>`;
