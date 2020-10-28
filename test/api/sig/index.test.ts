import { StatusCodes } from "http-status-codes";
import { Request as Req, Response as Res } from "express";
import typeorm = require("typeorm");

import { Response } from "../../../src/services/response";
import { SigDTO } from "../../../src/services/dtos/SigDTO";
import { ISigService } from "../../../src/services/sig";
import { PullFormatQuery } from "../../../src/queries/PullFormatQuery";
import { Reply } from "../../../src/services/reply";
import { getSig } from "../../../src/api/sig";

describe("Sig API", () => {
  beforeEach(() => {
    // Mock the db connection.
    typeorm.createConnection = jest.fn().mockResolvedValue(null);
  });

  test("Get a sig", async () => {
    // Mock the request.
    const sigName = "test";
    const mockRequest = ({
      params: {
        name: sigName,
      },
    } as unknown) as Req;

    const json = jest.fn();
    const status = jest.fn();
    const mockResponse = ({
      status,
      json,
    } as unknown) as Res;

    const response: Response<SigDTO> = {
      data: {
        name: "test",
        membership: {
          techLeaders: ["Rustin-Liu"],
          coLeaders: ["Rustin-Liu"],
          committers: ["Rustin-Liu"],
          reviewers: ["Rustin-Liu"],
          activeContributors: ["Rustin-Liu"],
        },
        needsLGTM: 2,
      },
      status: StatusCodes.OK,
      message: "Test",
    };

    const mockPullService: ISigService = {
      getSig(_: string): Promise<Response<SigDTO | null>> {
        return Promise.resolve(response);
      },
      updateSigInfo(_: PullFormatQuery): Promise<Reply<null> | null> {
        return Promise.resolve(null);
      },
    };

    // Get a sig.
    await getSig(mockRequest, mockResponse, mockPullService);

    // Assert response.
    expect(json.mock.calls.length).toBe(1);
    expect(json.mock.calls[0][0]).toBe(response);
    // Assert status.
    expect(status.mock.calls.length).toBe(1);
    expect(status.mock.calls[0][0]).toBe(StatusCodes.OK);
  });
});
