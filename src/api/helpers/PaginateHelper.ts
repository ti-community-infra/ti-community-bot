import { Request } from "express";

/**
 * Validate the current page number.
 * @param value
 * @param req
 */
export function validateCurrent(
  value: string | undefined,
  { req }: { req: Request }
): boolean {
  if (value !== undefined) {
    const current = Number(value);
    if (!Number.isInteger(current) || current <= 0) {
      throw new Error("Illegal current page number.");
    }

    if (req.query.pageSize === undefined) {
      throw new Error("Paging queries must have pageSize parameter.");
    }
  }

  return true;
}

/**
 * Validate page size number.
 * @param value
 * @param req
 */
export function validatePageSize(
  value: string | undefined,
  { req }: { req: Request }
): boolean {
  if (value !== undefined) {
    const pageSize = Number(value);
    if (!Number.isInteger(pageSize) || pageSize <= 0) {
      throw new Error("Illegal pageSize number.");
    }

    if (req.query.current === undefined) {
      throw new Error("Paging queries must have current page number parameter.");
    }
  }

  return true;
}
