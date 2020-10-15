import { Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";

import { Sig } from "../../../src/db/entities/Sig";
import { SigMember } from "../../../src/db/entities/SigMember";
import { PullOwnersQuery } from "../../../src/queries/PullOwnersQuery";
import PullService from "../../../src/services/pull";
import {
  migrateToJSONTip,
  mustMatchSchemaMessage,
  PullMessage,
} from "../../../src/services/messages/PullMessage";
import * as sigInfoUtil from "../../../src/services/utils/SigInfoUtils";
import { SigInfoSchema } from "../../../src/config/SigInfoSchema";
import { ContributorInfoWithLevel } from "../../../src/services/utils/SigInfoUtils";
import Ajv from "ajv";
import sigInfoSchema from "../../../src/config/sig.info.schema.json";
import { PullFormatQuery } from "../../../src/queries/PullFormatQuery";
import { Status } from "../../../src/services/reply";

describe("Pull Service", () => {
  let pullService: PullService;
  let sigRepository = new Repository<Sig>();
  let sigMemberRepository = new Repository<SigMember>();

  beforeEach(() => {
    pullService = new PullService(sigRepository, sigMemberRepository);
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
          githubId: "Rustin-Liu2",
        },
      ],
      coLeaders: [],
      committers: [],
      reviewers: [],
      activeContributors: [
        {
          githubId: "Rustin-Liu6",
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
          githubId: "Rustin-Liu2",
        },
      ],
      coLeaders: [],
      committers: [],
      reviewers: [],
      activeContributors: [
        {
          // NOTICE: same as techLeaders.
          githubId: "Rustin-Liu2",
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
          githubId: "Rustin-Liu2",
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

  test("list owners when not change sig info file", async () => {
    const collaborator = {
      githubId: "Rustin-Liu",
    };

    const pullOwnersQuery: PullOwnersQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "string",
          status: "string",
          raw_url: "string",
        },
      ],
      maintainers: [collaborator],
      collaborators: [collaborator],
    };

    // Owners should be collaborator.
    const res = await pullService.listOwners(pullOwnersQuery);

    expect(res.status).toBe(StatusCodes.OK);

    // Assert committers.
    expect(res.data!.approvers.length).toBe(1);
    expect(res.data!.approvers[0]).toBe(collaborator.githubId);

    // Assert reviewers.
    expect(res.data!.reviewers.length).toBe(1);
    expect(res.data!.reviewers[0]).toBe(collaborator.githubId);

    // Assert needs LGTM.
    expect(res.data!.needsLGTM).toBe(2);
  });

  test("list owners when change multiple sig info files", async () => {
    const collaborator = {
      githubId: "Rustin-Liu",
    };

    const pullOwnersQuery: PullOwnersQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list1",
          status: "string",
          raw_url: "string",
        },
        {
          sha: "string",
          filename: "member-list2",
          status: "string",
          raw_url: "string",
        },
      ],
      maintainers: [collaborator],
      collaborators: [collaborator],
    };

    // Should 400.
    const res = await pullService.listOwners(pullOwnersQuery);

    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.message).toBe(PullMessage.CanNotHandleMultipleSigFiles);
  });

  test("list owners when change sig info file's leaders part", async () => {
    const oldSigMembersWithLevel: ContributorInfoWithLevel[] = [
      {
        githubId: "Rustin-liu1",
        level: "leader",
      },
      {
        githubId: "Rustin-liu2",
        level: "co-leader",
      },
      {
        githubId: "Rustin-liu3",
        level: "committer",
      },
      {
        githubId: "Rustin-liu4",
        level: "reviewer",
      },
      {
        githubId: "Rustin-liu5",
        level: "active-contributor",
      },
    ];

    const newSigInfo: SigInfoSchema = {
      name: "Test",
      techLeaders: [
        {
          githubId: "Rustin-Liu2",
        },
      ],
      coLeaders: [],
      committers: [],
      reviewers: [],
      activeContributors: [
        {
          githubId: "Rustin-Liu6",
        },
      ],
    };

    // Mock get sig info and return new sig info.
    const getSigInfoMock = jest.spyOn(sigInfoUtil, "getSigInfo");
    getSigInfoMock.mockReturnValue(Promise.resolve(newSigInfo));

    // Mock find sig and return old sig.
    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    sigFindOneMock.mockReturnValue(Promise.resolve(new Sig()));

    // Mock list sig members.
    const listSigMembersMock = jest.spyOn(pullService as any, "listSigMembers");
    listSigMembersMock.mockReturnValue(oldSigMembersWithLevel);

    const maintainer = {
      githubId: "Rustin-Liu",
    };

    const pullOwnersQuery: PullOwnersQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list1",
          status: "string",
          raw_url: "string",
        },
      ],
      maintainers: [maintainer],
      collaborators: [maintainer],
    };

    // Owners should be maintainers.
    const res = await pullService.listOwners(pullOwnersQuery);

    // Assert status.
    expect(res.status).toBe(StatusCodes.OK);

    // Assert reviewers.
    expect(res.data!.reviewers.length).toBe(1);
    expect(res.data!.reviewers[0]).toBe(maintainer.githubId);

    // Assert committers.
    expect(res.data!.approvers.length).toBe(1);
    expect(res.data!.approvers[0]).toBe(maintainer.githubId);

    // Assert needsLGTM.
    expect(res.data!.needsLGTM).toBe(2);
  });

  test("list owners when change sig info file's reviewers part", async () => {
    const oldSigMembersWithLevel: ContributorInfoWithLevel[] = [
      {
        githubId: "Rustin-Liu1",
        level: "leader",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu2",
        level: "co-leader",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu3",
        level: "committer",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu4",
        level: "reviewer",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu5",
        level: "active-contributor",
        email: undefined,
        company: undefined,
      },
    ];

    const newSigInfo: SigInfoSchema = {
      name: "Test",
      techLeaders: [
        {
          githubId: "Rustin-Liu1",
        },
      ],
      coLeaders: [
        {
          githubId: "Rustin-Liu2",
        },
      ],
      committers: [
        {
          githubId: "Rustin-Liu3",
        },
      ],
      reviewers: [
        {
          githubId: "Rustin-Liu4",
        },
        {
          githubId: "Rustin-Liu5",
        },
      ],
      activeContributors: [
        {
          githubId: "Rustin-Liu6",
        },
      ],
    };

    const getSigInfoMock = jest.spyOn(sigInfoUtil, "getSigInfo");
    getSigInfoMock.mockReturnValue(Promise.resolve(newSigInfo));

    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    sigFindOneMock.mockReturnValue(Promise.resolve(new Sig()));

    const listSigMembersMock = jest.spyOn(pullService as any, "listSigMembers");
    listSigMembersMock.mockReturnValue(oldSigMembersWithLevel);

    const maintainer = {
      githubId: "Rustin-Liu",
    };

    const pullOwnersQuery: PullOwnersQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list1",
          status: "string",
          raw_url: "string",
        },
      ],
      maintainers: [maintainer],
      collaborators: [maintainer],
    };

    // Owners should > reviewers.
    const res = await pullService.listOwners(pullOwnersQuery);

    // Assert status.
    expect(res.status).toBe(StatusCodes.OK);

    // Assert reviewers.
    expect(res.data!.reviewers.length).toBe(4);
    expect(
      res.data!.reviewers.find((r) => {
        return r === maintainer.githubId;
      })
    ).not.toBe(undefined);
    expect(
      res.data!.reviewers.find((r) => {
        return r === "Rustin-Liu6";
      })
    ).toBe(undefined);

    // Assert committers.
    expect(res.data!.approvers.length).toBe(4);
    expect(
      res.data!.approvers.find((r) => {
        return r === "Rustin-Liu1";
      })
    ).not.toBe(undefined);
    expect(
      res.data!.approvers.find((r) => {
        return r === "Rustin-Liu6";
      })
    ).toBe(undefined);

    // Assert needsLGTM.
    expect(res.data!.needsLGTM).toBe(2);
  });

  test("list owners when change sig info file's active contributors part", async () => {
    const oldSigMembersWithLevel: ContributorInfoWithLevel[] = [
      {
        githubId: "Rustin-Liu1",
        level: "leader",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu2",
        level: "co-leader",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu3",
        level: "committer",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu4",
        level: "reviewer",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu5",
        level: "active-contributor",
        email: undefined,
        company: undefined,
      },
    ];

    const newSigInfo: SigInfoSchema = {
      name: "Test",
      techLeaders: [
        {
          githubId: "Rustin-Liu1",
        },
      ],
      coLeaders: [
        {
          githubId: "Rustin-Liu2",
        },
      ],
      committers: [
        {
          githubId: "Rustin-Liu3",
        },
      ],
      reviewers: [
        {
          githubId: "Rustin-Liu4",
        },
      ],
      activeContributors: [
        {
          githubId: "Rustin-Liu5",
        },
        {
          githubId: "Rustin-Liu6",
        },
      ],
    };

    const getSigInfoMock = jest.spyOn(sigInfoUtil, "getSigInfo");
    getSigInfoMock.mockReturnValue(Promise.resolve(newSigInfo));

    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    sigFindOneMock.mockReturnValue(Promise.resolve(new Sig()));

    const listSigMembersMock = jest.spyOn(pullService as any, "listSigMembers");
    listSigMembersMock.mockReturnValue(oldSigMembersWithLevel);

    const maintainer = {
      githubId: "Rustin-Liu",
    };

    const pullOwnersQuery: PullOwnersQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list1",
          status: "string",
          raw_url: "string",
        },
      ],
      maintainers: [maintainer],
      collaborators: [maintainer],
    };

    // Owners should > reviewers.
    const res = await pullService.listOwners(pullOwnersQuery);

    // Assert status.
    expect(res.status).toBe(StatusCodes.OK);

    // Assert reviewers.
    expect(res.data!.reviewers.length).toBe(5);
    expect(
      res.data!.reviewers.find((r) => {
        return r === maintainer.githubId;
      })
    ).not.toBe(undefined);
    expect(
      res.data!.reviewers.find((r) => {
        return r === "Rustin-Liu6";
      })
    ).toBe(undefined);

    // Assert committers.
    expect(res.data!.approvers.length).toBe(5);
    expect(
      res.data!.approvers.find((r) => {
        return r === "Rustin-Liu1";
      })
    ).not.toBe(undefined);
    expect(
      res.data!.approvers.find((r) => {
        return r === "Rustin-Liu6";
      })
    ).toBe(undefined);

    // Assert needsLGTM.
    expect(res.data!.needsLGTM).toBe(1);
  });

  test("list owners when add a sig info file", async () => {
    const newSigInfo: SigInfoSchema = {
      name: "Test",
      techLeaders: [
        {
          githubId: "Rustin-Liu1",
        },
      ],
      coLeaders: [
        {
          githubId: "Rustin-Liu2",
        },
      ],
      committers: [
        {
          githubId: "Rustin-Liu3",
        },
      ],
      reviewers: [
        {
          githubId: "Rustin-Liu4",
        },
        {
          githubId: "Rustin-Liu5",
        },
      ],
      activeContributors: [
        {
          githubId: "Rustin-Liu6",
        },
      ],
    };

    const getSigInfoMock = jest.spyOn(sigInfoUtil, "getSigInfo");
    getSigInfoMock.mockReturnValue(Promise.resolve(newSigInfo));

    //NOTICE: Mock find sig and return undefined.
    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    sigFindOneMock.mockReturnValue(Promise.resolve(undefined));

    const maintainer = {
      githubId: "Rustin-Liu",
    };

    const pullOwnersQuery: PullOwnersQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list1",
          status: "string",
          raw_url: "string",
        },
      ],
      maintainers: [maintainer],
      collaborators: [maintainer],
    };

    // List owners.
    const res = await pullService.listOwners(pullOwnersQuery);

    // Assert status.
    expect(res.status).toBe(StatusCodes.OK);

    // Assert reviewers.
    expect(res.data!.reviewers.length).toBe(1);
    expect(res.data!.reviewers[0]).toBe(maintainer.githubId);

    // Assert committers.
    expect(res.data!.approvers.length).toBe(1);
    expect(res.data!.approvers[0]).toBe(maintainer.githubId);

    // Assert needsLGTM.
    expect(res.data!.needsLGTM).toBe(2);
  });

  test("list owners when only fmt sig info file", async () => {
    const oldSigMembersWithLevel: ContributorInfoWithLevel[] = [
      {
        githubId: "Rustin-Liu1",
        level: "leader",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu2",
        level: "co-leader",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu3",
        level: "committer",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu4",
        level: "reviewer",
        email: undefined,
        company: undefined,
      },
      {
        githubId: "Rustin-Liu5",
        level: "active-contributor",
        email: undefined,
        company: undefined,
      },
    ];

    const newSigInfo: SigInfoSchema = {
      name: "Test",
      techLeaders: [
        {
          githubId: "Rustin-Liu1",
        },
      ],
      coLeaders: [
        {
          githubId: "Rustin-Liu2",
        },
      ],
      committers: [
        {
          githubId: "Rustin-Liu3",
        },
      ],
      reviewers: [
        {
          githubId: "Rustin-Liu4",
        },
      ],
      activeContributors: [
        {
          githubId: "Rustin-Liu5",
        },
      ],
    };

    const getSigInfoMock = jest.spyOn(sigInfoUtil, "getSigInfo");
    getSigInfoMock.mockReturnValue(Promise.resolve(newSigInfo));

    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    sigFindOneMock.mockReturnValue(Promise.resolve(new Sig()));

    const listSigMembersMock = jest.spyOn(pullService as any, "listSigMembers");
    listSigMembersMock.mockReturnValue(oldSigMembersWithLevel);

    const collaborator = {
      githubId: "Rustin-Liu",
    };

    const pullOwnersQuery: PullOwnersQuery = {
      sigInfoFileName: "member-list",
      files: [
        {
          sha: "string",
          filename: "member-list1",
          status: "string",
          raw_url: "string",
        },
      ],
      maintainers: [collaborator],
      collaborators: [collaborator],
    };

    // Owners should > reviewers.
    const res = await pullService.listOwners(pullOwnersQuery);

    // Assert status.
    expect(res.status).toBe(StatusCodes.OK);

    // Assert reviewers.
    expect(res.data!.reviewers.length).toBe(1);
    expect(res.data!.reviewers[0]).toBe(collaborator.githubId);

    // Assert committers.
    expect(res.data!.approvers.length).toBe(1);
    expect(res.data!.approvers[0]).toBe(collaborator.githubId);

    // Assert needsLGTM.
    expect(res.data!.needsLGTM).toBe(2);
  });
});
