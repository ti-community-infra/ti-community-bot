import { Request, Response } from "express";
import { ISigService } from "../../services/sig";

export async function getSig(
  req: Request,
  res: Response,
  sigService: ISigService
) {
  const sigName = req.params.name;

  const response = await sigService.getSig(sigName);

  res.status(response.status);
  res.json(response);
}

export async function listSigs(
  req: Request,
  res: Response,
  sigService: ISigService
) {
  // Gather paginate query.
  const { current, pageSize } = req.query;
  let paginateQuery;
  if (current !== undefined && pageSize !== undefined) {
    paginateQuery = {
      current: Number(current),
      pageSize: Number(pageSize),
    };
  }

  const response = await sigService.listSigs(paginateQuery);

  res.status(response.status);
  res.json(response);
}
