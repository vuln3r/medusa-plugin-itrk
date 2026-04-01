import { create } from "xmlbuilder2";

type ItrkVersionResponseInput = {
  shopVersion: string;
  moduleVersion: string;
};

type ItrkAccountListResponseInput = Array<{
  accountId: string;
  accountName: string;
  salesChannelId: string;
  languages: string[];
  countries: string[];
}>;

export function buildErrorResponse(
  code: number,
  message: string,
  versions: ItrkVersionResponseInput,
): string {
  const root = createResponseRoot().ele("status").txt("error").up();

  addMetaNodes(root, versions);

  return root
    .ele("error")
    .txt(String(code))
    .up()
    .ele("error_message")
    .txt(message)
    .doc()
    .end({ prettyPrint: true });
}

export function buildVersionResponse({
  shopVersion,
  moduleVersion,
}: ItrkVersionResponseInput): string {
  const root = createResponseRoot().ele("status").txt("success").up();

  addMetaNodes(root, { shopVersion, moduleVersion });

  return root.doc().end({ prettyPrint: true });
}

export function buildPushSuccessResponse({
  shopVersion,
  moduleVersion,
  targetUrl,
}: ItrkVersionResponseInput & {
  targetUrl?: string;
}): string {
  const root = createResponseRoot().ele("status").txt("success").up();

  addMetaNodes(root, { shopVersion, moduleVersion });

  if (targetUrl) {
    root.ele("target_url").txt(targetUrl).up();
  }

  return root.doc().end({ prettyPrint: true });
}

export function buildAccountListResponse(
  accounts: ItrkAccountListResponseInput,
  versions: ItrkVersionResponseInput,
): string {
  const root = createResponseRoot().ele("status").txt("success").up();

  addMetaNodes(root, versions);

  for (const account of accounts) {
    const accountNode = root.ele("account");

    accountNode.ele("accountid").txt(account.accountId).up();
    accountNode.ele("accountname").txt(account.accountName).up();

    if (account.languages.length > 0) {
      const localesNode = accountNode.ele("locales");

      for (const language of account.languages) {
        localesNode.ele("locale").txt(language).up();
      }

      localesNode.up();
    }

    if (account.countries.length > 0) {
      const countriesNode = accountNode.ele("countries");

      for (const country of account.countries) {
        countriesNode.ele("country").txt(country).up();
      }

      countriesNode.up();
    }

    accountNode.up();
  }

  return root.doc().end({ prettyPrint: true });
}

function createResponseRoot() {
  return create({
    version: "1.0",
    encoding: "UTF-8",
    standalone: true,
  }).ele("response");
}

function addMetaNodes(
  root: ReturnType<typeof createResponseRoot>,
  versions: ItrkVersionResponseInput,
) {
  root.ele("meta_shopversion").txt(versions.shopVersion).up();
  root.ele("meta_modulversion").txt(versions.moduleVersion).up();
}
