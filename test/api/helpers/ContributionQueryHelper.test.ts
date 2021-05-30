import { Request as Req } from "express";
import {
  validateEndDate,
  validateOrderBy,
  validateStartDate,
} from "../../../src/api/helpers/ContributionQueryHelper";

describe("Contribution Query Helper", () => {
  test("valid start date", () => {
    const mockRequest = {
      query: {
        endDate: "2020-12-30",
      },
    } as unknown as Req;
    const isValid = validateStartDate("2020-10-01", { req: mockRequest });
    expect(isValid).toBe(true);
  });

  test("invalid start date", () => {
    const mockRequest = {
      query: {
        endDate: "2020-12-30",
      },
    } as unknown as Req;
    const validator = () => {
      validateStartDate("20", { req: mockRequest });
    };
    expect(validator).toThrow();
  });

  test("valid start date without end date", () => {
    const mockRequest = {
      query: {},
    } as unknown as Req;
    const validator = () => {
      validateStartDate("2020-10-01", { req: mockRequest });
    };
    expect(validator).toThrow();
  });

  test("valid end date", () => {
    const mockRequest = {
      query: {
        startDate: "2020-10-01",
      },
    } as unknown as Req;
    const isValid = validateEndDate("2020-12-30", { req: mockRequest });
    expect(isValid).toBe(true);
  });

  test("invalid end date", () => {
    const mockRequest = {
      query: {
        startDate: "2020-10-01",
      },
    } as unknown as Req;
    const validator = () => {
      validateEndDate("20", { req: mockRequest });
    };
    expect(validator).toThrow();
  });

  test("valid end date without start date", () => {
    const mockRequest = {
      query: {},
    } as unknown as Req;
    const validator = () => {
      validateEndDate("2020-12-30", { req: mockRequest });
    };
    expect(validator).toThrow();
  });

  test("valid order", () => {
    const isValid = validateOrderBy("prCount");
    expect(isValid).toBe(true);
  });

  test("invalid order", () => {
    const validator = () => {
      validateOrderBy("random");
    };
    expect(validator).toThrow();
  });
});
