import { defineLink } from "@medusajs/framework/utils";
import SalesChannelModule from "@medusajs/medusa/sales-channel";

import ItrkModule from "../modules/itrk";

export default defineLink(
  {
    linkable: ItrkModule.linkable.itrkLegalDocument.id,
    field: "sales_channel_id",
  },
  SalesChannelModule.linkable.salesChannel,
  {
    readOnly: true,
  },
);
