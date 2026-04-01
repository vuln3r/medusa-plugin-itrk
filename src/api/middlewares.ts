import { defineMiddlewares } from "@medusajs/framework/http";
import { text } from "express";

const xmlBodyParser = text({
  type: ["text/xml", "application/xml", "application/*+xml"],
});

export default defineMiddlewares({
  routes: [
    {
      matcher: "/integrations/itrk",
      method: ["POST"],
      bodyParser: false,
      middlewares: [xmlBodyParser],
    },
  ],
});
