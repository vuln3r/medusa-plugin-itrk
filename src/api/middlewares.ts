import { defineMiddlewares } from "@medusajs/framework/http";
import { text } from "express";

const xmlBodyParser = text({
  // ITRK pushes can exceed body-parser's 100kb default once full legal text is included.
  limit: "10mb",
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
