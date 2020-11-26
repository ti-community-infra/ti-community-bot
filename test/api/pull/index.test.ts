import nock from "nock";
import { StatusCodes } from "http-status-codes";
import { Probot, ProbotOctokit } from "probot";
import { Request as Req, Response as Res } from "express";
import typeorm = require("typeorm");

import PullService, { IPullService } from "../../../src/services/pull";
import { PullOwnersQuery } from "../../../src/queries/PullOwnersQuery";
import { PullOwnersDTO } from "../../../src/services/dtos/PullOwnersDTO";
import { Response } from "../../../src/services/response";
import { listOwners } from "../../../src/api/pull";
import { Repository } from "typeorm";
import { Sig } from "../../../src/db/entities/Sig";
import SigMemberRepository from "../../../src/repositoies/sig-member";

const fs = require("fs");
const path = require("path");
const privateKey = fs.readFileSync(
  path.join(__dirname, "../../fixtures/mock-cert.pem"),
  "utf-8"
);

const collaborator = function (
  login: string,
  permissions: {
    pull: boolean;
    push: boolean;
    admin: boolean;
  },
  rest?: any
) {
  return Object.assign(
    {
      login: login,
      id: 1,
      node_id: "MDQ6VXNlcjE=",
      avatar_url: "https://github.com/images/error/octocat_happy.gif",
      gravatar_id: "",
      url: `https://api.github.com/users/${login}`,
      html_url: `https://github.com/${login}`,
      followers_url: `https://api.github.com/users/${login}/followers`,
      following_url: `https://api.github.com/users/${login}/following{/other_user}`,
      gists_url: "https://api.github.com/users/${ login }/gists{/gist_id}",
      starred_url: `https://api.github.com/users/${login}/starred{/owner}{/repo}`,
      subscriptions_url: `https://api.github.com/users/${login}/subscriptions`,
      organizations_url: `https://api.github.com/users/${login}/orgs`,
      repos_url: `https://api.github.com/users/${login}/repos`,
      events_url: `https://api.github.com/users/${login}/events{/privacy}`,
      received_events_url: `https://api.github.com/users/${login}/received_events`,
      type: "User",
      site_admin: false,
      permissions: permissions,
    },
    rest
  );
};

describe("Pull API", () => {
  let github: InstanceType<typeof ProbotOctokit>;
  let pullService: PullService;
  let sigRepository = new Repository<Sig>();
  let sigMemberRepository = new SigMemberRepository();

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

    pullService = new PullService(sigRepository, sigMemberRepository);
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
      .get(`/repos/${owner}/${repo}/pulls/${number}`)
      .reply(StatusCodes.OK, {
        labels: [],
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
        collaborator("octocat", {
          pull: true,
          push: true,
          admin: false,
        }),
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

  test("list Owners: PR without member-list file", async () => {
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
      .get(`/repos/${owner}/${repo}/pulls/${number}`)
      .reply(StatusCodes.OK, {
        labels: [],
      })
      .get(`/repos/${owner}/${repo}/pulls/${number}/files`)
      .reply(StatusCodes.OK, [])
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
        collaborator("octocat", {
          pull: true,
          push: true,
          admin: false,
        }),
        collaborator("Mini256", {
          pull: false,
          push: false,
          admin: false,
        }),
        collaborator("Rustin-Liu", {
          pull: true,
          push: true,
          admin: true,
        }),
        collaborator("Rustin-Liu2", {
          pull: true,
          push: false,
          admin: true,
        }),
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
        committers: ["octocat", "Rustin-Liu", "Rustin-Liu2"],
        reviewers: ["octocat", "Rustin-Liu", "Rustin-Liu2"],
        needsLGTM: 2,
      },
      status: StatusCodes.OK,
      message: "List reviewers success.",
    };

    // List Owners.
    await listOwners(mockRequest, mockResponse, pullService, github);

    // Assert response.
    expect(json.mock.calls.length).toBe(1);
    expect(json.mock.calls[0][0]).toStrictEqual(response);
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
