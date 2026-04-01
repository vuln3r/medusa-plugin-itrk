import {
  ItrkRequestValidationError,
  parseAndValidateItrkRequest,
} from "../validators";
describe("parseAndValidateItrkRequest", () => {
  it("parses a getversion request", () => {
    expect(parseAndValidateItrkRequest(getVersionXml)).toEqual({
      api_version: "1.0",
      user_auth_token: "EXAMPLE_TOKEN",
      action: "getversion",
    });
  });

  it("parses a getaccountlist request", () => {
    expect(parseAndValidateItrkRequest(getAccountListXml)).toEqual({
      api_version: "1.0",
      user_auth_token: "EXAMPLE_TOKEN",
      action: "getaccountlist",
    });
  });

  it("parses a push request", () => {
    const request = parseAndValidateItrkRequest(pushXml);

    expect(request).toMatchObject({
      api_version: "1.0",
      action: "push",
      user_auth_token: "EXAMPLE_TOKEN",
      user_account_id: "sc-id-01",
      rechtstext_type: "agb",
      rechtstext_title: "General Terms and Conditions",
      rechtstext_country: "DE",
      rechtstext_language: "en",
      rechtstext_language_iso639_2b: "eng",
      rechtstext_pdf_filenamebase_suggestion: "agb",
      rechtstext_pdf_filename_suggestion: "agb.pdf",
      rechtstext_pdf_localized_filenamebase_suggestion:
        "general-terms-and-conditions",
      rechtstext_pdf_url:
        "https://www.it-recht-kanzlei.de/rechtstexte/m1/181/1/1234567890abcdef1234567890abcdef.pdf",
      rechtstext_pdf_md5hash: "c9a0574850d3a3332d35991143dd08d5",
    });

    // Keep Typescript happy about the discriminated union
    // If we don't do this, the three lines below will cause a type error.
    if (request.action !== "push") {
      throw new Error("Expected action to be push");
    }

    expect(request.rechtstext_pdf).toContain("JVBERi0xLjQK");
    expect(request.rechtstext_text).toContain("General Terms and Conditions");
    expect(request.rechtstext_html).toContain(
      "<h1>General Terms and Conditions</h1>",
    );
  });

  it("rejects invalid XML", () => {
    expect(() => parseAndValidateItrkRequest("<api")).toThrow(
      ItrkRequestValidationError,
    );
    expect(() => parseAndValidateItrkRequest("<api")).toThrow(
      "Invalid XML request body",
    );
  });

  it("rejects requests without an api root", () => {
    expect(() =>
      parseAndValidateItrkRequest(
        `<?xml version="1.0" encoding="UTF-8"?><foo><action>getversion</action></foo>`,
      ),
    ).toThrow(ItrkRequestValidationError);
    expect(() =>
      parseAndValidateItrkRequest(
        `<?xml version="1.0" encoding="UTF-8"?><foo><action>getversion</action></foo>`,
      ),
    ).toThrow("Invalid ITRK request body");
  });

  it("rejects requests without a user auth token", () => {
    expect(() =>
      parseAndValidateItrkRequest(
        `<?xml version="1.0" encoding="UTF-8"?><api><api_version>1.0</api_version><action>getversion</action></api>`,
      ),
    ).toThrow(ItrkRequestValidationError);
    expect(() =>
      parseAndValidateItrkRequest(
        `<?xml version="1.0" encoding="UTF-8"?><api><api_version>1.0</api_version><action>getversion</action></api>`,
      ),
    ).toThrow("Invalid ITRK request envelope");

    expectValidationCode(
      `<?xml version="1.0" encoding="UTF-8"?><api><api_version>1.0</api_version><action>getversion</action></api>`,
      3,
    );
  });

  it("rejects requests without an api version", () => {
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?><api><user_auth_token>EXAMPLE_TOKEN</user_auth_token><action>getversion</action></api>`;

    expect(() => parseAndValidateItrkRequest(rawXml)).toThrow(
      ItrkRequestValidationError,
    );
    expectValidationCode(rawXml, 1);
  });

  it("rejects requests with an unsupported api version", () => {
    const rawXml = `<?xml version="1.0" encoding="UTF-8"?><api><api_version>2.0</api_version><user_auth_token>EXAMPLE_TOKEN</user_auth_token><action>getversion</action></api>`;

    expect(() => parseAndValidateItrkRequest(rawXml)).toThrow(
      ItrkRequestValidationError,
    );
    expectValidationCode(rawXml, 1);
  });

  it("rejects requests with an invalid action", () => {
    expect(() =>
      parseAndValidateItrkRequest(
        `<?xml version="1.0" encoding="UTF-8"?><api><api_version>1.0</api_version><user_auth_token>EXAMPLE_TOKEN</user_auth_token><action>invalid_action</action></api>`,
      ),
    ).toThrow(ItrkRequestValidationError);
    expect(() =>
      parseAndValidateItrkRequest(
        `<?xml version="1.0" encoding="UTF-8"?><api><api_version>1.0</api_version><user_auth_token>EXAMPLE_TOKEN</user_auth_token><action>invalid_action</action></api>`,
      ),
    ).toThrow("Invalid ITRK request envelope");
  });

  it("rejects push requests without a rechtstext title", () => {
    const invalidPushXml = pushXml.replace(
      "    <rechtstext_title>General Terms and Conditions</rechtstext_title>\n",
      "",
    );

    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      ItrkRequestValidationError,
    );
    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      "Invalid ITRK push request",
    );
  });

  it("rejects push requests without a user account id", () => {
    const invalidPushXml = pushXml.replace(
      "    <user_account_id>sc-id-01</user_account_id>\n",
      "",
    );

    expectValidationCode(invalidPushXml, 11);
  });

  it("rejects push requests with an invalid rechtstext type", () => {
    const invalidPushXml = pushXml.replace(
      "<rechtstext_type>agb</rechtstext_type>",
      "<rechtstext_type>invalid_type</rechtstext_type>",
    );

    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      ItrkRequestValidationError,
    );
    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      "Invalid ITRK push request",
    );
  });

  it("rejects push requests with an invalid rechtstext country", () => {
    const invalidPushXml = pushXml.replace(
      "<rechtstext_country>DE</rechtstext_country>",
      "<rechtstext_country>DEU</rechtstext_country>",
    );

    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      ItrkRequestValidationError,
    );
    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      "Invalid ITRK push request",
    );
  });

  it("rejects push requests with an invalid rechtstext language", () => {
    const invalidPushXml = pushXml.replace(
      "<rechtstext_language>en</rechtstext_language>",
      "<rechtstext_language> </rechtstext_language>",
    );

    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      ItrkRequestValidationError,
    );
    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      "Invalid ITRK push request",
    );
  });

  it("rejects push requests with an invalid iso639 language code", () => {
    const invalidPushXml = pushXml.replace(
      "<rechtstext_language_iso639_2b>eng</rechtstext_language_iso639_2b>",
      "<rechtstext_language_iso639_2b>en</rechtstext_language_iso639_2b>",
    );

    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      ItrkRequestValidationError,
    );
    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      "Invalid ITRK push request",
    );

    expectValidationCode(invalidPushXml, 9);
  });

  it("rejects push requests without rechtstext language", () => {
    const invalidPushXml = pushXml.replace(
      "    <rechtstext_language>en</rechtstext_language>\n",
      "",
    );

    expectValidationCode(invalidPushXml, 9);
  });

  it("maps invalid deprecated filename suggestion values to vendor code 8", () => {
    const invalidPushXml = pushXml.replace(
      "<rechtstext_pdf_filename_suggestion>agb.pdf</rechtstext_pdf_filename_suggestion>",
      "<rechtstext_pdf_filename_suggestion> </rechtstext_pdf_filename_suggestion>",
    );

    expectValidationCode(invalidPushXml, 8);
  });

  it("maps invalid localized filename suggestion values to vendor code 19", () => {
    const invalidPushXml = pushXml.replace(
      "<rechtstext_pdf_localized_filenamebase_suggestion>general-terms-and-conditions</rechtstext_pdf_localized_filenamebase_suggestion>",
      "<rechtstext_pdf_localized_filenamebase_suggestion> </rechtstext_pdf_localized_filenamebase_suggestion>",
    );

    expectValidationCode(invalidPushXml, 19);
  });

  it("rejects push requests without rechtstext html", () => {
    const invalidPushXml = pushXml.replace(
      "    <rechtstext_html>&lt;div&gt;&lt;h1&gt;General Terms and Conditions&lt;/h1&gt;\n\n        &lt;h2&gt;Table of Contents&lt;/h2&gt;\n        &lt;ol&gt;\n        &lt;li&gt;Scope of Application&lt;/li&gt;\n        &lt;li&gt;Conclusion of the Contract&lt;/li&gt;\n        &lt;/ol&gt;\n\n        &lt;h2&gt;1) Scope of Application&lt;/h2&gt;&lt;/div&gt;</rechtstext_html>\n",
      "",
    );

    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      ItrkRequestValidationError,
    );
    expect(() => parseAndValidateItrkRequest(invalidPushXml)).toThrow(
      "Invalid ITRK push request",
    );
  });

  it("rejects push requests without rechtstext country", () => {
    const invalidPushXml = pushXml.replace(
      "    <rechtstext_country>DE</rechtstext_country>\n",
      "",
    );

    expectValidationCode(invalidPushXml, 17);
  });

  it("rejects push requests without rechtstext text", () => {
    const invalidPushXml = pushXml.replace(
      "    <rechtstext_text>––––––––––––––––––––––––––––&#13;\n        General Terms and Conditions&#13;\n        ––––––––––––––––––––––––––––&#13;\n        &#13;\n        &#13;\n        Table of Contents&#13;\n        –––––––––––––––––&#13;\n        1. Scope of Application&#13;\n        2. Conclusion of the Contract&#13;\n        &#13;\n        &#13;\n        1) Scope of Application&#13;</rechtstext_text>\n",
      "",
    );

    expectValidationCode(invalidPushXml, 5);
  });
});

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

const pushXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<api>
    <api_version>1.0</api_version>
    <action>push</action>
    <user_auth_token>EXAMPLE_TOKEN</user_auth_token>
    <user_account_id>sc-id-01</user_account_id>
    <rechtstext_type>agb</rechtstext_type>
    <rechtstext_type_ucase>AGB</rechtstext_type_ucase>
    <rechtstext_title>General Terms and Conditions</rechtstext_title>
    <rechtstext_country>DE</rechtstext_country>
    <rechtstext_language>en</rechtstext_language>
    <rechtstext_language_iso639_2b>eng</rechtstext_language_iso639_2b>
    <rechtstext_pdf_filenamebase_suggestion>agb</rechtstext_pdf_filenamebase_suggestion>
    <rechtstext_pdf_filename_suggestion>agb.pdf</rechtstext_pdf_filename_suggestion>
    <rechtstext_pdf_localized_filenamebase_suggestion>general-terms-and-conditions</rechtstext_pdf_localized_filenamebase_suggestion>
    <rechtstext_pdf_url>https://www.it-recht-kanzlei.de/rechtstexte/m1/181/1/1234567890abcdef1234567890abcdef.pdf</rechtstext_pdf_url>
    <rechtstext_pdf>JVBERi0xLjQKJeKCrOKAmsaSCjEgMCBvYmo8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PmVuZG9iagoyIDAgb2JqPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj5lbmRvYmoKMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvTWVkaWFCb3hbMCAwIDU5NSA3OTJdL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA0IDAgUj4+Pj4vQ29udGVudHMgNSAwIFI+PmVuZG9iago0IDAgb2JqPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvTmFtZS9GMS9CYXNlRm9udC9IZWx2ZXRpY2EvRW5jb2RpbmcvTWFjUm9tYW5FbmNvZGluZz4+ZW5kb2JqCjUgMCBvYmo8PC9MZW5ndGggNDQ+PgpzdHJlYW0KQlQgL0YxIDIwIFRmIDIyMCA3MDAgVGQgKEhlbGxvIFdvcmxkISkgVGogRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNiAKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDEwNyAwMDAwMCBuIAowMDAwMDAwMjE3IDAwMDAwIG4gCjAwMDAwMDAzMTIgMDAwMDAgbiAKdHJhaWxlcgo8PC9Sb290IDEgMCBSL1NpemUgNj4+CnN0YXJ0eHJlZgo0MDMKJSVFT0Y=</rechtstext_pdf>
    <rechtstext_pdf_md5hash>c9a0574850d3a3332d35991143dd08d5</rechtstext_pdf_md5hash>
    <rechtstext_text>––––––––––––––––––––––––––––&#13;
        General Terms and Conditions&#13;
        ––––––––––––––––––––––––––––&#13;
        &#13;
        &#13;
        Table of Contents&#13;
        –––––––––––––––––&#13;
        1. Scope of Application&#13;
        2. Conclusion of the Contract&#13;
        &#13;
        &#13;
        1) Scope of Application&#13;</rechtstext_text>
    <rechtstext_html>&lt;div&gt;&lt;h1&gt;General Terms and Conditions&lt;/h1&gt;

        &lt;h2&gt;Table of Contents&lt;/h2&gt;
        &lt;ol&gt;
        &lt;li&gt;Scope of Application&lt;/li&gt;
        &lt;li&gt;Conclusion of the Contract&lt;/li&gt;
        &lt;/ol&gt;

        &lt;h2&gt;1) Scope of Application&lt;/h2&gt;&lt;/div&gt;</rechtstext_html>
</api>`;

function expectValidationCode(rawXml: string, code: number) {
  try {
    parseAndValidateItrkRequest(rawXml);
    throw new Error("Expected validation to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(ItrkRequestValidationError);
    expect((error as ItrkRequestValidationError).code).toBe(code);
  }
}
