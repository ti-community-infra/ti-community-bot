import { Request } from "express";

import { ContributionOrder } from "../../queries/ContributionQuery";

/**
 * Validate start date query.
 * @param value
 * @param req
 */
export function validateStartDate(
  value: string | undefined,
  { req }: { req: Request }
): boolean {
  if (value !== undefined) {
    new Date(value).toISOString();

    if (req.query.endDate === undefined) {
      throw new Error("Contribution date queries must have endDate.");
    }
  }

  return true;
}

/**
 * Validate end date query.
 * @param value
 * @param req
 */
export function validateEndDate(
  value: string | undefined,
  { req }: { req: Request }
): boolean {
  if (value !== undefined) {
    new Date(value).toISOString();

    if (req.query.startDate === undefined) {
      throw new Error("Contribution date queries must have startDate.");
    }
  }

  return true;
}

/**
 * Validate order by query.
 * @param value
 */
export function validateOrderBy(value?: string) {
  if (value !== undefined) {
    const orders = Object.values(ContributionOrder);
    const validOrder = orders.find((order) => {
      return order === value;
    });

    if (validOrder === undefined) {
      throw new Error(`Illegal order, only ${orders.join("|")} are supported.`);
    }
  }

  return true;
}
