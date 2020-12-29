import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

import { IStatisticsService } from "../../services/statistics";
import { Response as Res } from "../../services/response";
import {
  ContributionQuery,
  ContributionOrder,
} from "../../queries/ContributionQuery";

/**
 * List contribution.
 * @param req
 * @param res
 * @param statisticsService
 */
export async function listContributions(
  req: Request,
  res: Response,
  statisticsService: IStatisticsService
) {
  // Validate quires.
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

  // Gather contribution query.
  const { startDate, endDate, orderBy } = req.query;
  let contributionQuery: ContributionQuery = {
    startDate:
      startDate !== undefined ? new Date(String(startDate)) : undefined,
    endDate: endDate !== undefined ? new Date(String(endDate)) : undefined,
    // Default order by count.
    orderBy: orderBy === undefined ? ContributionOrder.Count : String(orderBy),
  };

  // Gather paginate query.
  const { current, pageSize } = req.query;
  let paginateQuery;
  if (current !== undefined && pageSize !== undefined) {
    paginateQuery = {
      current: Number(current),
      pageSize: Number(pageSize),
    };
  }

  const response = await statisticsService.listContributions(
    contributionQuery,
    paginateQuery
  );

  res.status(response.status);
  res.json(response);
  return res;
}
