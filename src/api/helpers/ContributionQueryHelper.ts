import { Request } from "express";
import { ContributionOrder } from "../../queries/ContributionQuery";

export function validateStartDate(
  value: string | undefined,
  { req }: { req: Request }
): boolean {
  if (value !== undefined) {
    new Date(value);

    if (req.query.endDate === undefined) {
      throw new Error("Contribution date queries must have endDate.");
    }
  }

  return true;
}

export function validateEndDate(
  value: string | undefined,
  { req }: { req: Request }
): boolean {
  if (value !== undefined) {
    new Date(value);

    if (req.query.startDate === undefined) {
      throw new Error("Contribution date queries must have startDate.");
    }
  }
  return true;
}

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
