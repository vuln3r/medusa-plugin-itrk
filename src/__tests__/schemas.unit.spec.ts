import { itrkPluginOptionsSchema } from "../schemas";

describe("itrkPluginOptionsSchema", () => {
  it("preserves configured locale casing for channel languages", () => {
    const parsed = itrkPluginOptionsSchema.parse({
      token: "token",
      channels: [
        {
          salesChannelId: "sc_123",
          accountId: "account-1",
          accountName: "Main Store",
          languages: ["de_DE", "en_GB"],
          countries: ["de", "at"],
        },
      ],
    });

    expect(parsed.channels[0].languages).toEqual(["de_DE", "en_GB"]);
    expect(parsed.channels[0].countries).toEqual(["DE", "AT"]);
  });

  it("requires an account name when accountId is not 0", () => {
    const result = itrkPluginOptionsSchema.safeParse({
      token: "token",
      channels: [
        {
          salesChannelId: "sc_123",
          accountId: "account-1",
          accountName: "   ",
          languages: ["de"],
          countries: ["DE"],
        },
      ],
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected schema validation to fail");
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "Account name is required unless accountId is '0'",
          path: ["channels", 0, "accountName"],
        }),
      ]),
    );
  });

  it("allows an empty account name when accountId is 0", () => {
    const parsed = itrkPluginOptionsSchema.parse({
      token: "token",
      channels: [
        {
          salesChannelId: "sc_123",
          accountId: "0",
          accountName: "   ",
          languages: ["de"],
          countries: ["DE"],
        },
      ],
    });

    expect(parsed.channels[0].accountName).toBe("");
  });

  it("does not expose shopVersion in parsed plugin options", () => {
    const parsed = itrkPluginOptionsSchema.parse({
      token: "token",
      channels: [
        {
          salesChannelId: "sc_123",
          accountId: "0",
          accountName: "",
          languages: ["de"],
          countries: ["DE"],
        },
      ],
    });

    expect(parsed).not.toHaveProperty("shopVersion");
  });
});
