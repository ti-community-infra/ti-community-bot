import { StatusCodes } from "http-status-codes";
import { Request as Req, Response as Res } from "express";
import typeorm = require("typeorm");

import { Response } from "../../../src/services/response";
import { SigDetailsDTO } from "../../../src/services/dtos/SigDetailsDTO";
import { ISigService } from "../../../src/services/sig";
import { PullFormatQuery } from "../../../src/queries/PullFormatQuery";
import { Reply } from "../../../src/services/reply";
import { getSig, listSigs } from "../../../src/api/sig";
import { PaginateQuery } from "../../../src/queries/PaginateQuery";
import { SigsDTO } from "../../../src/services/dtos/SigsDTO";

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

  test("List all sigs", async () => {
    // Mock the request.
    const mockRequest = ({
      query: {},
    } as unknown) as Req;

    const json = jest.fn();
    const status = jest.fn();
    const mockResponse = ({
      status,
      json,
    } as unknown) as Res;

    const response: Response<SigsDTO> = {
      data: {
        sigs: [
          {
            id: 1003,
            name: "test",
            info: "info",
            sigUrl: "url",
            channel: "channel",
            needsLGTM: 2,
          },
          {
            id: 1004,
            name: "tes1",
            info: "info",
            sigUrl: "url",
            channel: "channel",
            needsLGTM: 2,
          },
        ],
        total: 2,
      },
      status: StatusCodes.OK,
      message: "Test",
    };

    const mockPullService: ISigService = {
      getSig(_: string): Promise<Response<SigDetailsDTO | null>> {
        return Promise.resolve({
          data: null,
          status: StatusCodes.OK,
          message: "Test",
        });
      },
      updateSigInfo(_: PullFormatQuery): Promise<Reply<null> | null> {
        return Promise.resolve(null);
      },
      listSigs(_?: PaginateQuery): Promise<Response<SigsDTO>> {
        return Promise.resolve(response);
      },
    };

    // Get a sig.
    await listSigs(mockRequest, mockResponse, mockPullService);

    // Assert response.
    expect(json.mock.calls.length).toBe(1);
    expect(json.mock.calls[0][0]).toBe(response);
    // Assert status.
    expect(status.mock.calls.length).toBe(1);
    expect(status.mock.calls[0][0]).toBe(StatusCodes.OK);
  });
});
