import { Module } from "@medusajs/framework/utils";

import validateOptionsLoader from "./loaders/validate";
import ItrkModuleService from "./service";

export const ITRK_MODULE = "itrk";

export default Module(ITRK_MODULE, {
  loaders: [validateOptionsLoader],
  service: ItrkModuleService,
});
