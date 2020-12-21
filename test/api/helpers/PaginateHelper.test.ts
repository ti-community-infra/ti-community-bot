import {
  validateCurrent,
  validatePageSize,
} from "../../../src/api/helpers/PaginateHelper";
import { Request as Req } from "express";

describe("Paginate Helper", () => {
  test("valid current number", () => {
    const mockRequest = ({
      query: {
        pageSize: 2,
      },
    } as unknown) as Req;
    const isValid = validateCurrent("1", { req: mockRequest });
    expect(isValid).toBe(true);
  });

  test("invalid current number", () => {
    const mockRequest = ({
      query: {
        pageSize: 2,
      },
    } as unknown) as Req;
    const validator = () => {
      validateCurrent("-1", { req: mockRequest });
    };
    expect(validator).toThrow();
  });

  test("valid current without pageSize", () => {
    const mockRequest = ({
      query: {},
    } as unknown) as Req;
    const validator = () => {
      validateCurrent("1", { req: mockRequest });
    };
    expect(validator).toThrow();
  });

  test("valid pageSize number", () => {
    const mockRequest = ({
      query: {
        current: 2,
      },
    } as unknown) as Req;
    const isValid = validatePageSize("10", { req: mockRequest });
    expect(isValid).toBe(true);
  });

  test("invalid pageSize number", () => {
    const mockRequest = ({
      query: {
        current: 2,
      },
    } as unknown) as Req;
    const validator = () => {
      validatePageSize("-1", { req: mockRequest });
    };
    expect(validator).toThrow();
  });

  test("valid pageSize without current", () => {
    const mockRequest = ({
      query: {},
    } as unknown) as Req;
    const validator = () => {
      validatePageSize("10", { req: mockRequest });
    };
    expect(validator).toThrow();
  });
});
