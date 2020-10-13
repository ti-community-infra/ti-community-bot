import { Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";

import { Sig } from "../../../src/db/entities/Sig";
import { SigMember } from "../../../src/db/entities/SigMember";
import { PullOwnersQuery } from "../../../src/queries/PullOwnersQuery";
import PullService from "../../../src/services/pull";
import { PullMessage } from "../../../src/services/messages/PullMessage";
import * as sigInfoUtil from "../../../src/services/utils/SigInfoUtils";
import { SigInfoSchema } from "../../../src/config/SigInfoSchema";
import { ContributorInfoWithLevel } from "../../../src/services/utils/SigInfoUtils";

describe("Pull Service", () => {
  let pullService: PullService;
  let sigRepository = new Repository<Sig>();
  let sigMemberRepository = new Repository<SigMember>();

  beforeEach(() => {
    pullService = new PullService(sigRepository, sigMemberRepository);
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
    expect(res.data!.committers.length).toBe(1);
    expect(res.data!.committers[0]).toBe(collaborator.githubId);

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
          githubId: "Rustin-Li2",
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

    const contributor = {
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
      maintainers: [contributor],
      collaborators: [contributor],
    };

    // Owners should be maintainers.
    const res = await pullService.listOwners(pullOwnersQuery);

    // Assert status.
    expect(res.status).toBe(StatusCodes.OK);

    // Assert reviewers.
    expect(res.data!.reviewers.length).toBe(1);
    expect(res.data!.reviewers[0]).toBe(contributor.githubId);

    // Assert committers.
    expect(res.data!.committers.length).toBe(1);
    expect(res.data!.committers[0]).toBe(contributor.githubId);

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

    const contributor = {
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
      maintainers: [contributor],
      collaborators: [contributor],
    };

    // Owners should > reviewers.
    const res = await pullService.listOwners(pullOwnersQuery);

    // Assert status.
    expect(res.status).toBe(StatusCodes.OK);

    // Assert reviewers.
    expect(res.data!.reviewers.length).toBe(4);
    expect(
      res.data!.reviewers.find((r) => {
        return r === contributor.githubId;
      })
    ).not.toBe(undefined);
    expect(
      res.data!.reviewers.find((r) => {
        return r === "Rustin-Liu6";
      })
    ).toBe(undefined);

    // Assert committers.
    expect(res.data!.committers.length).toBe(4);
    expect(
      res.data!.committers.find((r) => {
        return r === "Rustin-Liu1";
      })
    ).not.toBe(undefined);
    expect(
      res.data!.committers.find((r) => {
        return r === "Rustin-Liu6";
      })
    ).toBe(undefined);

    // Assert needsLGTM.
    expect(res.data!.needsLGTM).toBe(2);
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

    const contributor = {
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
      maintainers: [contributor],
      collaborators: [contributor],
    };

    // List owners.
    const res = await pullService.listOwners(pullOwnersQuery);

    // Assert status.
    expect(res.status).toBe(StatusCodes.OK);

    // Assert reviewers.
    expect(res.data!.reviewers.length).toBe(1);
    expect(res.data!.reviewers[0]).toBe(contributor.githubId);

    // Assert committers.
    expect(res.data!.committers.length).toBe(1);
    expect(res.data!.committers[0]).toBe(contributor.githubId);

    // Assert needsLGTM.
    expect(res.data!.needsLGTM).toBe(2);
  });
});
