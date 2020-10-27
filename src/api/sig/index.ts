import { Request, Response } from "express";
import { SigService } from "../../services/sig";

export async function getSig(
  req: Request,
  res: Response,
  sigService: SigService
) {
  const sigName = req.params.name;

  const response = await sigService.getSig(sigName);

  res.status(response.status);
  res.json(response);
}
