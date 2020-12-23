import { StatusCodes } from "http-status-codes";
import { Request as Req, Response as Res } from "express";

import { Response } from "../../../src/services/response";
import { SigDetailsDTO } from "../../../src/services/dtos/SigDetailsDTO";
import { ISigService } from "../../../src/services/sig";
import { PullFormatQuery } from "../../../src/queries/PullFormatQuery";
import { Reply } from "../../../src/services/reply";
import { getSig } from "../../../src/api/sig";
import { PaginateQuery } from "../../../src/queries/PaginateQuery";
import { SigsDTO } from "../../../src/services/dtos/SigsDTO";
import typeorm = require("typeorm");

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

    const response: Response<SigDetailsDTO> = {
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
      getSig(_: string): Promise<Response<SigDetailsDTO | null>> {
        return Promise.resolve(response);
      },
      updateSigInfo(_: PullFormatQuery): Promise<Reply<null> | null> {
        return Promise.resolve(null);
      },
      listSigs(_?: PaginateQuery): Promise<Response<SigsDTO>> {
        return Promise.resolve({
          data: {
            sigs: [],
            total: 0,
          },
          status: StatusCodes.OK,
          message: "Test",
        });
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
