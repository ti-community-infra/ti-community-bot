import { Request, Response } from "express";
import { IMemberService } from "../../services/member";
import { validationResult } from "express-validator";
import { Response as Res } from "../../services/response";
import { StatusCodes } from "http-status-codes";

export async function listMembers(
  req: Request,
  res: Response,
  memberService: IMemberService
) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: Res<null> = {
      data: null,
      status: StatusCodes.BAD_REQUEST,
      message: `${errors.array({ onlyFirstError: true })[0].msg}.`,
    };

    res.status(response.status);
    res.json(response);
    return res;
  }

  // Gather paginate query.
  const { current, pageSize, level, sigId } = req.query;

  let memberQuery = {
    // TODO: validate the level.
    level: level ? String(level) : undefined,
    // TODO: validate the sig id.
    sigId: Number(sigId),
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
