// You can import your modules
// import index from '../src/index'

import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../src";
import { Probot, ProbotOctokit, Server } from "probot";
// Requiring our fixtures
import payload from "./fixtures/issues.ping.comment.json";
import typeorm = require("typeorm");

const pongBody = { body: "pong! I am community bot." };
const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8"
);

describe("My Probot app", () => {
  let probot: any;

  beforeEach(async () => {
    typeorm.createConnection = jest.fn().mockResolvedValue(null);
    nock.disableNetConnect();
    const server = new Server({
      Probot: Probot.defaults({
        appId: 123,
        privateKey: privateKey,
        secret: "secret",
        // Disable request throttling and retries for testing.
        Octokit: ProbotOctokit.defaults({
          retry: { enabled: false },
          throttle: { enabled: false },
        }),
      }),
    });
    probot = server.probotApp;
    await server.load(myProbotApp);
  });

  test("creates a comment when got a ping command", async (done) => {
    const mock = nock("https://api.github.com")
      // Test that we correctly return a test token
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          issues: "write",
        },
      })

      // Test that a comment is posted
      .post(
        "/repos/Rustin-Liu/ti-community-bot/issues/1/comments",
        (body: any) => {
          done(expect(body).toMatchObject(pongBody));
          return true;
        }
      )
      .reply(200);

    // Receive a webhook event
    await probot.receive({ name: "issue_comment", payload });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
