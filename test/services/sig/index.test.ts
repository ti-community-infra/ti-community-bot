import { SigService } from "../../../src/services/sig";
import { Repository } from "typeorm";
import { SigMember } from "../../../src/db/entities/SigMember";
import { Sig } from "../../../src/db/entities/Sig";
import { ContributorInfo } from "../../../src/db/entities/ContributorInfo";
import { PullFormatQuery } from "../../../src/queries/PullFormatQuery";
import * as sigInfoUtil from "../../../src/services/utils/SigInfoUtils";
import { SigInfoSchema } from "../../../src/config/SigInfoSchema";
import { Status } from "../../../src/services/reply";

describe("Sig Service", () => {
  let sigService: SigService;
  let sigRepository = new Repository<Sig>();
  let sigMemberRepository = new Repository<SigMember>();
  let contributorInfoRepository = new Repository<ContributorInfo>();

  beforeEach(() => {
    sigService = new SigService(
      sigRepository,
      sigMemberRepository,
      contributorInfoRepository
    );
  });

  test("update sig info when not change sig info", async () => {
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

    const reply = await sigService.updateSigInfo(pullFormatQuery);

    expect(reply).toBe(null);
  });

  test("update sig info when change sig info", async () => {
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
          githubId: "Rustin-Liu6",
        },
      ],
      coLeaders: [],
      committers: [],
      reviewers: [],
      activeContributors: [],
    };

    // Mock get sig info and return new sig info.
    const getSigInfoMock = jest.spyOn(sigInfoUtil, "getSigInfo");
    getSigInfoMock.mockReturnValue(Promise.resolve(newSigInfo));

    // Mock find sig and return old sig.
    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    const sig = new Sig();
    sig.id = 1;
    sigFindOneMock.mockReturnValue(Promise.resolve(sig));

    // Mock find contributor.
    const contributorFindOneMock = jest.spyOn(
      contributorInfoRepository,
      "findOne"
    );
    const contributorInfo = new ContributorInfo();
    contributorInfo.github = newSigInfo.techLeaders[0].githubId;
    contributorInfo.id = 1;
    contributorFindOneMock.mockReturnValue(Promise.resolve(contributorInfo));

    // Mock save contributor.
    const contributorSaveMock = jest.spyOn(contributorInfoRepository, "save");
    contributorSaveMock.mockReturnValue(Promise.resolve(contributorInfo));

    // Mock delete sig members.
    const sigMemberDeleteMock = jest.spyOn(sigMemberRepository, "query");
    sigMemberDeleteMock.mockReturnValue(Promise.resolve());

    // Mock find sig member.
    const sigMemberFindOneMock = jest.spyOn(sigMemberRepository, "findOne");
    const sigMember = new SigMember();
    sigMember.level = "co-leader";
    sigMemberFindOneMock.mockReturnValue(Promise.resolve(sigMember));

    // Mock save sig member.
    const sigMemberSaveMock = jest.spyOn(sigMemberRepository, "save");
    sigMember.level = "leader";
    sigMemberSaveMock.mockReturnValue(Promise.resolve(sigMember));

    const reply = await sigService.updateSigInfo(pullFormatQuery);

    expect(sigFindOneMock.mock.calls.length).toBe(1);
    expect(sigFindOneMock.mock.calls[0][0]).toStrictEqual({
      where: { name: newSigInfo.name },
    });

    expect(contributorFindOneMock.mock.calls.length).toBe(1);
    expect(contributorFindOneMock.mock.calls[0][0]).toStrictEqual({
      where: { github: newSigInfo.techLeaders[0].githubId },
    });

    expect(contributorSaveMock.mock.calls.length).toBe(1);
    expect(contributorSaveMock.mock.calls[0][0]).toStrictEqual(contributorInfo);

    expect(sigMemberDeleteMock.mock.calls.length).toBe(1);
    expect(sigMemberDeleteMock.mock.calls[0][0]).toStrictEqual(
      `delete from sig_member where sig_id = '${sig.id}'`
    );

    expect(sigMemberFindOneMock.mock.calls.length).toBe(1);
    expect(sigMemberFindOneMock.mock.calls[0][0]).toStrictEqual({
      where: {
        contributorId: contributorInfo.id,
        sigId: sig.id,
      },
    });

    expect(sigMemberSaveMock.mock.calls.length).toBe(1);
    expect(sigMemberSaveMock.mock.calls[0][0]).toStrictEqual(sigMember);

    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Success);
  });
});
