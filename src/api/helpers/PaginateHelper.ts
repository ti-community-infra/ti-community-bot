import { Request } from "express";

export function validateCurrent(
  value: string,
  { req }: { req: Request }
): boolean {
  if (value != undefined) {
    const current = Number(value);
    if (!Number.isInteger(current) || current <= 0) {
      throw new Error("Illegal current num");
    }
    if (req.query.pageSize === undefined) {
      throw new Error("Paging queries must have pageSize");
    }
  }

  return true;
}

export function validatePageSize(
  value: string,
  { req }: { req: Request }
): boolean {
  if (value != undefined) {
    const pageSize = Number(value);
    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      throw new Error("Illegal pageSize num");
    }
    if (req.query.current === undefined) {
      throw new Error("Paging queries must have current");
    }
  }

  return true;
}