import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

import { IMemberService } from "../../services/member";
import { Response as Res } from "../../services/response";

export async function listMembers(
  req: Request,
  res: Response,
  memberService: IMemberService
) {
  // Validate queries.
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
  const { current, pageSize, level, sigId } = req.query;

  let memberQuery = {
    level: level !== undefined ? String(level) : undefined,
    sigId: sigId !== undefined ? Number(sigId) : undefined,
  };

  let paginateQuery;
  if (current !== undefined && pageSize !== undefined) {
    paginateQuery = {
      current: Number(current),
      pageSize: Number(pageSize),
    };
  }

  const response = await memberService.listMembers(memberQuery, paginateQuery);

  res.status(response.status);
  res.json(response);
  return res;
}
