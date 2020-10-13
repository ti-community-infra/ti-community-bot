import nock from "nock";
import { StatusCodes } from "http-status-codes";
import { Probot, ProbotOctokit } from "probot";
import { Request as Req, Response as Res } from "express";
import typeorm = require("typeorm");

import listOwners from "../../../src/api/pull";
import { IPullService } from "../../../src/services/pull";
import { PullOwnersQuery } from "../../../src/queries/PullOwnersQuery";
import { PullOwnersDTO } from "../../../src/services/dtos/PullOwnersDTO";
import { Response } from "../../../src/services/response";

const fs = require("fs");
const path = require("path");
const privateKey = fs.readFileSync(
  path.join(__dirname, "../../fixtures/mock-cert.pem"),
  "utf-8"
);

describe("Pull API", () => {
  let github: InstanceType<typeof ProbotOctokit>;
  // Maintainer team slug.
  const team_slug = "bots-test";
  const installationId = 2;

  beforeEach(() => {
    // Mock the db connection.
    typeorm.createConnection = jest.fn().mockResolvedValue(null);
    nock.disableNetConnect();
    // Create probot.
    const probot = new Probot({
      id: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });

    // Get github client.
    probot.load(async (app) => {
      github = await app.auth(installationId);
      github.config.get = jest.fn().mockReturnValue({
        config: {
          maintainerTeamSlug: team_slug,
        },
      });
    });
  });

  test("list Owners", async () => {
    const owner = "tidb-community-bots";
    const repo = "ti-community-bot";
    const number = "1";

    const mock = nock("https://api.github.com")
      // Test that we correctly return a test token
      .post(`/app/installations/${installationId}/access_tokens`)
      .reply(StatusCodes.OK, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })
      .get(`/repos/${owner}/${repo}/pulls/${number}/files`)
      .reply(StatusCodes.OK, [
        {
          sha: "bbcd538c8e72b8c175046e27cc8f907076331401",
          filename: "file1.txt",
          status: "added",
          additions: 103,
          deletions: 21,
          changes: 124,
          blob_url:
            "https://github.com/octocat/Hello-World/blob/6dcb09b5b57875f334f61aebed695e2e4193db5e/file1.txt",
          raw_url:
            "https://github.com/octocat/Hello-World/raw/6dcb09b5b57875f334f61aebed695e2e4193db5e/file1.txt",
          contents_url:
            "https://api.github.com/repos/octocat/Hello-World/contents/file1.txt?ref=6dcb09b5b57875f334f61aebed695e2e4193db5e",
          patch:
            "@@ -132,7 +132,7 @@ module Test @@ -1000,7 +1000,7 @@ module Test",
        },
      ])
      .get(`/orgs/${owner}/teams/${team_slug}/members`)
      .reply(StatusCodes.OK, [
        {
          login: "octocat",
          id: 1,
          node_id: "MDQ6VXNlcjE=",
          avatar_url: "https://github.com/images/error/octocat_happy.gif",
          gravatar_id: "",
          url: "https://api.github.com/users/octocat",
          html_url: "https://github.com/octocat",
          followers_url: "https://api.github.com/users/octocat/followers",
          following_url:
            "https://api.github.com/users/octocat/following{/other_user}",
          gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
          starred_url:
            "https://api.github.com/users/octocat/starred{/owner}{/repo}",
          subscriptions_url:
            "https://api.github.com/users/octocat/subscriptions",
          organizations_url: "https://api.github.com/users/octocat/orgs",
          repos_url: "https://api.github.com/users/octocat/repos",
          events_url: "https://api.github.com/users/octocat/events{/privacy}",
          received_events_url:
            "https://api.github.com/users/octocat/received_events",
          type: "User",
          site_admin: false,
        },
      ])
      .get(`/repos/${owner}/${repo}/collaborators`)
      .reply(StatusCodes.OK, [
        {
          login: "octocat",
          id: 1,
          node_id: "MDQ6VXNlcjE=",
          avatar_url: "https://github.com/images/error/octocat_happy.gif",
          gravatar_id: "",
          url: "https://api.github.com/users/octocat",
          html_url: "https://github.com/octocat",
          followers_url: "https://api.github.com/users/octocat/followers",
          following_url:
            "https://api.github.com/users/octocat/following{/other_user}",
          gists_url: "https://api.github.com/users/octocat/gists{/gist_id}",
          starred_url:
            "https://api.github.com/users/octocat/starred{/owner}{/repo}",
          subscriptions_url:
            "https://api.github.com/users/octocat/subscriptions",
          organizations_url: "https://api.github.com/users/octocat/orgs",
          repos_url: "https://api.github.com/users/octocat/repos",
          events_url: "https://api.github.com/users/octocat/events{/privacy}",
          received_events_url:
            "https://api.github.com/users/octocat/received_events",
          type: "User",
          site_admin: false,
          permissions: {
            pull: true,
            push: true,
            admin: false,
          },
        },
      ]);

    const mockRequest = ({
      params: {
        owner,
        repo,
        number,
      },
    } as unknown) as Req;

    const json = jest.fn();
    const status = jest.fn();
    const mockResponse = ({
      status,
      json,
    } as unknown) as Res;

    const response: Response<PullOwnersDTO> = {
      data: {
        committers: ["Rustin-Liu"],
        reviewers: ["Rustin-Liu"],
        needsLGTM: 2,
      },
      status: StatusCodes.OK,
      message: "Test",
    };

    const mockPullService: IPullService = {
      async listOwners(
        _: PullOwnersQuery
      ): Promise<Response<PullOwnersDTO | null>> {
        return Promise.resolve(response);
      },
    };

    // List Owners.
    await listOwners(mockRequest, mockResponse, mockPullService, github);

    // Assert response.
    expect(json.mock.calls.length).toBe(1);
    expect(json.mock.calls[0][0]).toBe(response);
    // Assert status.
    expect(status.mock.calls.length).toBe(1);
    expect(status.mock.calls[0][0]).toBe(StatusCodes.OK);

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
