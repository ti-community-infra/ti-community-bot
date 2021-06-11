import Ajv from "ajv";

import PullService from "../../../src/services/pull";
import {
  mustBeJSONFileMessage,
  mustMatchSchemaMessage,
  PullMessage,
} from "../../../src/services/messages/PullMessage";
import * as sigInfoUtil from "../../../src/services/utils/SigInfoUtils";
import { SigInfoSchema } from "../../../src/config/SigInfoSchema";
import sigInfoSchema from "../../../src/config/sig.info.schema.json";
import { PullFormatQuery } from "../../../src/queries/PullFormatQuery";
import { Status } from "../../../src/services/reply";
import {migrateToJSONTip} from "../../../lib/services/messages/PullMessage";

const ajv = Ajv();
const validate = ajv.compile(sigInfoSchema);

describe("Pull Service", () => {
  let pullService: PullService;

  beforeEach(() => {
    pullService = new PullService();
  });

  test("checking the PR format without changing the SIG membership file", async () => {
    const pullFormatQuery: PullFormatQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "string",
          status: "string",
          raw_url: "string",
        },
      ],
    };
    const reply = await pullService.checkFormatting(validate, pullFormatQuery);

    expect(reply).toBe(null);
  });

  test("checking the PR format when SIG membership file extension is wrong", async () => {
    const pullFormatQuery: PullFormatQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list.md",
          status: "string",
          raw_url: "string",
        },
      ],
    };

    const reply = await pullService.checkFormatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Failed);
    expect(reply!.message).toContain(mustBeJSONFileMessage(pullFormatQuery.sigInfoFileName));
    expect(reply!.message).toContain(migrateToJSONTip());
  });

  test("checking the PR format when changing SIG membership file", async () => {
    const pullFormatQuery: PullFormatQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list.json",
          status: "string",
          raw_url: "string",
        },
      ],
    };

    const newSigInfo: SigInfoSchema = {
      name: "Test",
      techLeaders: [
        {
          githubName: "Rustin-Liu2",
        },
      ],
      coLeaders: [],
      committers: [],
      reviewers: [],
      activeContributors: [
        {
          githubName: "Rustin-Liu6",
        },
      ],
    };

    // Mock get sig info and return new sig info.
    const getSigInfoMock = jest.spyOn(sigInfoUtil, "getSigInfo");
    getSigInfoMock.mockReturnValue(Promise.resolve(newSigInfo));

    const reply = await pullService.checkFormatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Success);
  });

  test("checking the PR format when changing SIG membership file to add multiple roles", async () => {
    const pullFormatQuery: PullFormatQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list.json",
          status: "string",
          raw_url: "string",
        },
      ],
    };

    const newSigInfo: SigInfoSchema = {
      name: "Test",
      techLeaders: [
        {
          githubName: "Rustin-Liu2",
        },
      ],
      coLeaders: [],
      committers: [],
      reviewers: [],
      activeContributors: [
        {
          // NOTICE: same as techLeaders.
          githubName: "Rustin-Liu2",
        },
      ],
    };

    // Mock get sig info and return new sig info.
    const getSigInfoMock = jest.spyOn(sigInfoUtil, "getSigInfo");
    getSigInfoMock.mockReturnValue(Promise.resolve(newSigInfo));

    const reply = await pullService.checkFormatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Failed);
    expect(reply!.message).toContain(PullMessage.ContributorCanOnlyHaveOneRole);
  });

  test("checking the PR format when changing SIG membership file to illegal schema", async () => {
    const pullFormatQuery: PullFormatQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list.json",
          status: "string",
          raw_url: "string",
        },
      ],
    };

    const newSigInfo: any = {
      name: "Test",
      techLeaders: [
        {
          githubName: "Rustin-Liu2",
        },
      ],
      coLeaders: [],
      committers: [],
      reviewers: [],
    };

    // Mock get sig info and return new sig info.
    const getSigInfoMock = jest.spyOn(sigInfoUtil, "getSigInfo");
    getSigInfoMock.mockReturnValue(Promise.resolve(newSigInfo));

    const reply = await pullService.checkFormatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Failed);
    expect(reply!.message).toContain(
      mustMatchSchemaMessage(pullFormatQuery.sigInfoFileName)
    );
  });

  test("checking the PR format when changing multiple SIG membership files", async () => {
    const pullFormatQuery: PullFormatQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list.json",
          status: "string",
          raw_url: "string",
        },
        {
          sha: "string",
          filename: "member-list1.json",
          status: "string",
          raw_url: "string",
        },
      ],
    };

    const reply = await pullService.checkFormatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Failed);
    expect(reply!.message).toBe(PullMessage.CanNotModifyMultipleSigsFiles);
  });
});
