import { Request, Response } from "express";

import { IContributorsService } from "../../services/contributor";
import { StatusCodes } from "http-status-codes";
import { Response as Res } from "../../services/response";
import { ContributorMessage } from "../../services/messages/ContributorMessage";

export async function listContributors(
  req: Request,
  res: Response,
  contributorService: IContributorsService
) {
  // Gather params.
  const { current, pageSize } = req.query;
  let paginateQuery;
  if (current !== undefined && pageSize !== undefined) {
    const currentNum = Number(current);
    const pageSizeNum = Number(pageSize);
    if (!Number.isInteger(currentNum) || !Number.isInteger(pageSizeNum)) {
      res.status(StatusCodes.BAD_REQUEST);
      const response: Res<null> = {
        data: null,
        status: StatusCodes.BAD_REQUEST,
        message: ContributorMessage.IllegalQueryParameters,
      };

      res.status(response.status);
      res.json(response);
      return;
    }
    paginateQuery = {
      current: currentNum,
      pageSize: pageSizeNum,
    };
  }

  const response = await contributorService.listContributors(paginateQuery);

  res.status(response.status);
  res.json(response);
}
