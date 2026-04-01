import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

import {
  ItrkRequestValidationError,
  parseAndValidateItrkRequest,
} from "./validators";
import { ITRK_MODULE } from "../../../modules/itrk";
import ItrkModuleService, {
  ItrkServiceError,
} from "../../../modules/itrk/service";
import {
  buildAccountListResponse,
  buildErrorResponse,
  buildPushSuccessResponse,
  buildVersionResponse,
} from "../../../xml";

export async function POST(req: MedusaRequest<string>, res: MedusaResponse) {
  const itrkService = req.scope.resolve<ItrkModuleService>(ITRK_MODULE);
  const versions = itrkService.getVersions();

  try {
    const request = parseAndValidateItrkRequest(req.body);

    if (!itrkService.authenticateToken(request.user_auth_token)) {
      sendXml(res, buildErrorResponse(3, "Invalid token", versions));

      return;
    }

    const action = request.action;
    switch (action) {
      case "getversion":
        sendXml(res, buildVersionResponse(versions));

        return;
      case "getaccountlist":
        sendXml(
          res,
          buildAccountListResponse(itrkService.listAccounts(), versions),
        );

        return;
      case "push":
        sendXml(
          res,
          buildPushSuccessResponse({
            ...versions,
            ...(await itrkService.handlePush(request)),
          }),
        );

        return;
      default:
        exhaustiveGuard(action);
    }
  } catch (error) {
    if (error instanceof ItrkRequestValidationError) {
      sendXml(res, buildErrorResponse(error.code, error.message, versions));

      return;
    }

    if (error instanceof ItrkServiceError) {
      sendXml(res, buildErrorResponse(error.code, error.message, versions));

      return;
    }

    sendXml(res, buildErrorResponse(99, "Unknown error", versions));
  }
}

function sendXml(res: MedusaResponse, body: string): MedusaResponse {
  return res
    .status(200)
    .set("Content-Type", "text/xml; charset=utf-8")
    .send(body);
}

function exhaustiveGuard(_value: never): never {
  throw new Error("Unexpected value: " + _value);
}
