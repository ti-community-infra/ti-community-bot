import { StatusCodes } from "http-status-codes";
import { Request as Req, Response as Res } from "express";
import typeorm = require("typeorm");

import { Response } from "../../../src/services/response";
import { ContributorsDTO } from "../../../src/services/dtos/ContributorsDTO";
import { IContributorService } from "../../../src/services/contributor";
import { PaginateQuery } from "../../../src/queries/PaginateQuery";
import { listContributors } from "../../../src/api/contributor";

describe("Contributors API", () => {
  beforeEach(() => {
    // Mock the db connection.
    typeorm.createConnection = jest.fn().mockResolvedValue(null);
  });

  test("List all contributors", async () => {
    // No paginate query.
    const mockRequest = {
      query: {},
    } as unknown as Req;

    const json = jest.fn();
    const status = jest.fn();
    const mockResponse = {
      status,
      json,
    } as unknown as Res;

    const response: Response<ContributorsDTO> = {
      data: {
        contributors: [
          {
            githubName: "contributor1",
          },
          {
            githubName: "contributor2",
          },
          {
            githubName: "contributor3",
          },
        ],
        total: 3,
      },
      status: StatusCodes.OK,
      message: "Test",
    };

    const mockContributorService: IContributorService = {
      listContributors(_?: PaginateQuery): Promise<Response<ContributorsDTO>> {
        return Promise.resolve(response);
      },
    };

    await listContributors(mockRequest, mockResponse, mockContributorService);

    // Assert response.
    expect(json.mock.calls.length).toBe(1);
    expect(json.mock.calls[0][0]).toBe(response);
    // Assert status.
    expect(status.mock.calls.length).toBe(1);
    expect(status.mock.calls[0][0]).toBe(StatusCodes.OK);
  });
});
