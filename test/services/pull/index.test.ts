import PullService from "../../../src/services/pull";
import {
  migrateToJSONTip,
  mustMatchSchemaMessage,
  PullMessage,
} from "../../../src/services/messages/PullMessage";
import * as sigInfoUtil from "../../../src/services/utils/SigInfoUtils";
import { SigInfoSchema } from "../../../src/config/SigInfoSchema";
import Ajv from "ajv";
import sigInfoSchema from "../../../src/config/sig.info.schema.json";
import { PullFormatQuery } from "../../../src/queries/PullFormatQuery";
import { Status } from "../../../src/services/reply";

describe("Pull Service", () => {
  let pullService: PullService;

  beforeEach(() => {
    pullService = new PullService();
  });

  test("formatting PR when not change sig info file", async () => {
    const ajv = Ajv();
    const validate = ajv.compile(sigInfoSchema);
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
    const reply = await pullService.formatting(validate, pullFormatQuery);

    expect(reply).toBe(null);
  });

  test("formatting PR when first change sig info file", async () => {
    const ajv = Ajv();
    const validate = ajv.compile(sigInfoSchema);
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

    const reply = await pullService.formatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Problematic);
    expect(reply!.tip).toStrictEqual(migrateToJSONTip());
  });

  test("formatting PR when change sig info file", async () => {
    const ajv = Ajv();
    const validate = ajv.compile(sigInfoSchema);
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

    const reply = await pullService.formatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Success);
  });

  test("formatting PR when change sig info file to add multiple roles", async () => {
    const ajv = Ajv();
    const validate = ajv.compile(sigInfoSchema);
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

    const reply = await pullService.formatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Problematic);
    expect(reply!.message).toBe(PullMessage.OnlyOneRole);
  });

  test("formatting PR when change sig info file to illegal", async () => {
    const ajv = Ajv();
    const validate = ajv.compile(sigInfoSchema);
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

    const reply = await pullService.formatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Problematic);
    expect(reply!.message).toBe(
      mustMatchSchemaMessage(pullFormatQuery.sigInfoFileName)
    );
  });

  test("formatting PR when change multiple sig info files", async () => {
    const ajv = Ajv();
    const validate = ajv.compile(sigInfoSchema);
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

    const reply = await pullService.formatting(validate, pullFormatQuery);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Failed);
    expect(reply!.message).toBe(PullMessage.CanNotModifyMultipleSigFiles);
  });
});
