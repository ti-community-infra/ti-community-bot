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
