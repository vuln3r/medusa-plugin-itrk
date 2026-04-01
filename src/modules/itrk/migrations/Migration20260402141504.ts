import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260402141504 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "itrk_legal_document" drop constraint if exists "itrk_legal_document_sales_channel_id_document_type_language_country_unique";`,
    );
    this.addSql(
      `create table if not exists "itrk_legal_document" ("id" text not null, "sales_channel_id" text not null, "account_id" text not null, "document_type" text check ("document_type" in ('impressum', 'agb', 'datenschutz', 'widerruf')) not null, "title" text not null, "language" text not null, "country" text not null, "text" text not null, "html" text not null, "target_url" text null, "pdf_file_id" text null, "pdf_url" text null, "pdf_md5hash" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "itrk_legal_document_pkey" primary key ("id"));`,
    );
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_itrk_legal_document_deleted_at" ON "itrk_legal_document" ("deleted_at") WHERE deleted_at IS NULL;`,
    );
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_itrk_legal_document_sales_channel_id_document_type_language_country_unique" ON "itrk_legal_document" ("sales_channel_id", "document_type", "language", "country") WHERE deleted_at IS NULL;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "itrk_legal_document" cascade;`);
  }
}
