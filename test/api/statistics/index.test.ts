import { StatusCodes } from "http-status-codes";
import { Request as Req, Response as Res } from "express";
import typeorm = require("typeorm");

import { Response } from "../../../src/services/response";
import { PaginateQuery } from "../../../src/queries/PaginateQuery";
import { ContributionsDTO } from "../../../src/services/dtos/ContributionsDTO";
import { IStatisticsService } from "../../../src/services/statistics";
import { ContributionQuery } from "../../../src/queries/ContributionQuery";
import { listContributions } from "../../../src/api/statistics";

describe("Statistics API", () => {
  beforeEach(() => {
    // Mock the db connection.
    typeorm.createConnection = jest.fn().mockResolvedValue(null);
  });

  test("List all contributions", async () => {
    // No paginate query.
    const mockRequest = ({
      query: {},
    } as unknown) as Req;

    const json = jest.fn();
    const status = jest.fn();
    const mockResponse = ({
      status,
      json,
    } as unknown) as Res;

    const response: Response<ContributionsDTO> = {
      data: {
        contributions: [
          {
            githubName: "contributor1",
            prCount: 10,
            score: 100,
            sigs: "test",
          },
          {
            githubName: "contributor2",
            prCount: 11,
            score: 1000,
            sigs: "test,test1",
          },
          {
            githubName: "contributor3",
            prCount: 1,
            score: 6000,
            sigs: "test1",
          },
        ],
        total: 3,
      },
      status: StatusCodes.OK,
      message: "Test",
    };

    const mockStatisticsService: IStatisticsService = {
      listContributions(
        _: ContributionQuery,
        __?: PaginateQuery
      ): Promise<Response<ContributionsDTO>> {
        return Promise.resolve(response);
      },
    };

    // Get a sig.
    await listContributions(mockRequest, mockResponse, mockStatisticsService);

    // Assert response.
    expect(json.mock.calls.length).toBe(1);
    expect(json.mock.calls[0][0]).toBe(response);
    // Assert status.
    expect(status.mock.calls.length).toBe(1);
    expect(status.mock.calls[0][0]).toBe(StatusCodes.OK);
  });
});
