import { model } from "@medusajs/framework/utils";

const LegalDocument = model
  .define("itrk_legal_document", {
    id: model.id().primaryKey(),
    sales_channel_id: model.text(),
    account_id: model.text(),
    document_type: model.enum(["impressum", "agb", "datenschutz", "widerruf"]),
    title: model.text(),
    language: model.text(),
    country: model.text(),
    text: model.text(),
    html: model.text(),
    target_url: model.text().nullable(),
    pdf_file_id: model.text().nullable(),
    pdf_url: model.text().nullable(),
    pdf_md5hash: model.text().nullable(),
  })
  .indexes([
    {
      on: ["sales_channel_id", "document_type", "language", "country"],
      unique: true,
    },
  ]);

export default LegalDocument;
