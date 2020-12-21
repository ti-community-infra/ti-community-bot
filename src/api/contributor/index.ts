import { Request, Response } from "express";
import { validationResult } from "express-validator";

import { IContributorService } from "../../services/contributor";
import { StatusCodes } from "http-status-codes";
import { Response as Res } from "../../services/response";

/**
 * List contributors.
 * @param req
 * @param res
 * @param contributorService
 */
export async function listContributors(
  req: Request,
  res: Response,
  contributorService: IContributorService
) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: Res<null> = {
      data: null,
      status: StatusCodes.BAD_REQUEST,
      message: errors.array({ onlyFirstError: true })[0].msg,
    };

    res.status(response.status);
    res.json(response);
    return res;
  }

  // Gather paginate query.
  const { current, pageSize } = req.query;
  let paginateQuery;

  // Validate paginate query.
  if (current !== undefined && pageSize !== undefined) {
    paginateQuery = {
      current: Number(current),
      pageSize: Number(pageSize),
    };
  }

  const response = await contributorService.listContributors(paginateQuery);

  res.status(response.status);
  res.json(response);
  return res;
}
