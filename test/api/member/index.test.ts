import { StatusCodes } from "http-status-codes";
import { Request as Req, Response as Res } from "express";
import typeorm = require("typeorm");

import { Response } from "../../../src/services/response";
import { PaginateQuery } from "../../../src/queries/PaginateQuery";
import { MembersDTO } from "../../../src/services/dtos/MembersDTO";
import { IMemberService } from "../../../src/services/member";
import { MemberQuery } from "../../../src/queries/MemberQuery";
import { listMembers } from "../../../src/api/member";

describe("Members API", () => {
  beforeEach(() => {
    // Mock the db connection.
    typeorm.createConnection = jest.fn().mockResolvedValue(null);
  });

  test("List all members", async () => {
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

    const response: Response<MembersDTO> = {
      data: {
        members: [
          {
            githubName: "member1",
            level: "leader",
          },
          {
            githubName: "member2",
            level: "leader",
          },
          {
            githubName: "member3",
            level: "leader",
          },
        ],
        total: 3,
      },
      status: StatusCodes.OK,
      message: "Test",
    };

    const mockMemberService: IMemberService = {
      listMembers(
        _?: MemberQuery,
        __?: PaginateQuery
      ): Promise<Response<MembersDTO>> {
        return Promise.resolve(response);
      },
    };

    // Get a sig.
    await listMembers(mockRequest, mockResponse, mockMemberService);

    // Assert response.
    expect(json.mock.calls.length).toBe(1);
    expect(json.mock.calls[0][0]).toBe(response);
    // Assert status.
    expect(status.mock.calls.length).toBe(1);
    expect(status.mock.calls[0][0]).toBe(StatusCodes.OK);
  });
});
