import { Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";

import { SigService } from "../../../src/services/sig";
import { SigMember } from "../../../src/db/entities/SigMember";
import { Sig } from "../../../src/db/entities/Sig";
import { PullFormatQuery } from "../../../src/queries/PullFormatQuery";
import * as sigInfoUtil from "../../../src/services/utils/SigInfoUtils";
import { SigInfoSchema } from "../../../src/config/SigInfoSchema";
import { Status } from "../../../src/services/reply";
import SigMemberRepository from "../../../src/repositoies/sig-member";
import { SigMessage } from "../../../src/services/messages/SigMessage";
import { ContributorInfo } from "../../../src/db/entities/ContributorInfo";
import { Member } from "../../../src/services/member";

describe("Sig Service", () => {
  let sigService: SigService;
  let sigRepository = new Repository<Sig>();
  let sigMemberRepository = new SigMemberRepository();
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

  test("update sig info when change a sig info file", async () => {
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
          githubName: "Rustin-Liu6",
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

    // Mock save sig.
    const sigSaveMock = jest.spyOn(sigRepository, "save");
    sigSaveMock.mockReturnValue(Promise.resolve(sig));

    // Mock find contributor.
    const contributorFindOneMock = jest.spyOn(
      contributorInfoRepository,
      "findOne"
    );
    const contributorInfo = new ContributorInfo();
    contributorInfo.github = newSigInfo.techLeaders[0].githubName;
    contributorInfo.id = 1;
    contributorFindOneMock.mockReturnValue(Promise.resolve(contributorInfo));

    // Mock save contributor.
    const contributorSaveMock = jest.spyOn(contributorInfoRepository, "save");
    contributorSaveMock.mockReturnValue(Promise.resolve(contributorInfo));

    // Mock find sig members.
    const sigMemberFindMock = jest.spyOn(sigMemberRepository, "find");
    const sigMember = new SigMember();
    sigMember.level = "co-leader";
    sigMember.contributorId = 1;
    sigMemberFindMock.mockReturnValue(Promise.resolve([sigMember]));

    // Mock save sig member.
    const sigMemberSaveMock = jest.spyOn(sigMemberRepository, "save");
    sigMember.level = "leader";
    sigMemberSaveMock.mockReturnValue(Promise.resolve(sigMember));

    // Mock remove sig member.
    const sigMemberRemoveMock = jest.spyOn(sigMemberRepository, "remove");
    sigMemberRemoveMock.mockImplementation();

    const reply = await sigService.updateSigInfo(pullFormatQuery);

    // Assert sig find.
    expect(sigFindOneMock.mock.calls.length).toBe(1);
    expect(sigFindOneMock.mock.calls[0][0]).toStrictEqual({
      where: { name: newSigInfo.name },
    });

    // Assert contributor find.
    expect(contributorFindOneMock.mock.calls.length).toBe(1);
    expect(contributorFindOneMock.mock.calls[0][0]).toStrictEqual({
      where: { github: newSigInfo.techLeaders[0].githubName },
    });

    // Assert contributor save.
    expect(contributorSaveMock.mock.calls.length).toBe(1);
    expect(contributorSaveMock.mock.calls[0][0]).toStrictEqual(contributorInfo);

    // Assert sig member save.
    expect(sigMemberSaveMock.mock.calls.length).toBe(1);
    expect(sigMemberSaveMock.mock.calls[0][0].level).toStrictEqual(
      sigMember.level
    );

    // Assert sig member remove.
    expect(sigMemberRemoveMock.mock.calls.length).toBe(1);
    expect(sigMemberRemoveMock.mock.calls[0][0]).toStrictEqual([]);

    // Assert reply.
    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Success);
  });

  test("update sig info when add a sig info file", async () => {
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
          githubName: "Rustin-Liu6",
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

    // Mock find sig and return undefined
    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    sigFindOneMock.mockReturnValue(Promise.resolve(undefined));

    // Mock save sig.
    const sigSaveMock = jest.spyOn(sigRepository, "save");
    const sig = new Sig();
    sig.id = 1;
    sig.name = newSigInfo.name;
    sigSaveMock.mockReturnValue(Promise.resolve(sig));

    // Mock find contributor.
    const contributorFindOneMock = jest.spyOn(
      contributorInfoRepository,
      "findOne"
    );
    const contributorInfo = new ContributorInfo();
    contributorInfo.github = newSigInfo.techLeaders[0].githubName;
    contributorInfo.id = 1;
    contributorFindOneMock.mockReturnValue(Promise.resolve(contributorInfo));

    // Mock save contributor.
    const contributorSaveMock = jest.spyOn(contributorInfoRepository, "save");
    contributorSaveMock.mockReturnValue(Promise.resolve(contributorInfo));

    // Mock find sig members.
    const sigMemberFindMock = jest.spyOn(sigMemberRepository, "find");
    const sigMember = new SigMember();
    sigMember.level = "co-leader";
    sigMember.contributorId = 1;
    sigMemberFindMock.mockReturnValue(Promise.resolve([sigMember]));

    // Mock save sig member.
    const sigMemberSaveMock = jest.spyOn(sigMemberRepository, "save");
    sigMember.level = "leader";
    sigMemberSaveMock.mockReturnValue(Promise.resolve(sigMember));

    // Mock remove sig member.
    const sigMemberRemoveMock = jest.spyOn(sigMemberRepository, "remove");
    sigMemberRemoveMock.mockImplementation();

    const reply = await sigService.updateSigInfo(pullFormatQuery);

    // Assert sig find.
    expect(sigFindOneMock.mock.calls.length).toBe(1);
    expect(sigFindOneMock.mock.calls[0][0]).toStrictEqual({
      where: { name: newSigInfo.name },
    });

    // Assert sig save.
    expect(sigSaveMock.mock.calls.length).toBe(1);
    expect(sigSaveMock.mock.calls[0][0].name).toStrictEqual(sig.name);

    // Assert contributor find.
    expect(contributorFindOneMock.mock.calls.length).toBe(1);
    expect(contributorFindOneMock.mock.calls[0][0]).toStrictEqual({
      where: { github: newSigInfo.techLeaders[0].githubName },
    });

    // Assert contributor save.
    expect(contributorSaveMock.mock.calls.length).toBe(1);
    expect(contributorSaveMock.mock.calls[0][0]).toStrictEqual(contributorInfo);

    // Assert sig member save.˚
    expect(sigMemberSaveMock.mock.calls.length).toBe(1);
    expect(sigMemberSaveMock.mock.calls[0][0]).toStrictEqual(sigMember);

    // Assert sig member remove.
    expect(sigMemberRemoveMock.mock.calls.length).toBe(1);
    expect(sigMemberRemoveMock.mock.calls[0][0]).toStrictEqual([]);

    // Assert reply.
    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Success);
  });

  test("update sig info when add a sig member", async () => {
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
          githubName: "Rustin-Liu6",
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

    // Mock find sig and return undefined
    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    const sig = new Sig();
    sig.id = 1;
    sig.name = newSigInfo.name;
    sigFindOneMock.mockReturnValue(Promise.resolve(sig));

    // Mock save sig.
    const sigSaveMock = jest.spyOn(sigRepository, "save");
    sigSaveMock.mockReturnValue(Promise.resolve(sig));

    // Mock find contributor.
    const contributorFindOneMock = jest.spyOn(
      contributorInfoRepository,
      "findOne"
    );
    contributorFindOneMock.mockReturnValue(Promise.resolve(undefined));

    // Mock save contributor.
    const contributorSaveMock = jest.spyOn(contributorInfoRepository, "save");
    const contributorInfo = new ContributorInfo();
    contributorInfo.github = newSigInfo.techLeaders[0].githubName;
    contributorInfo.id = 1;
    contributorSaveMock.mockReturnValue(Promise.resolve(contributorInfo));

    // Mock find sig members.
    const sigMemberFindMock = jest.spyOn(sigMemberRepository, "find");
    const sigMember = new SigMember();
    sigMember.level = "co-leader";
    sigMember.contributorId = 1;
    sigMemberFindMock.mockReturnValue(Promise.resolve([sigMember]));

    // Mock remove sig member.
    const sigMemberRemoveMock = jest.spyOn(sigMemberRepository, "remove");
    sigMemberRemoveMock.mockImplementation();

    // Mock save sig member.
    const sigMemberSaveMock = jest.spyOn(sigMemberRepository, "save");
    sigMember.level = "leader";
    sigMemberSaveMock.mockReturnValue(Promise.resolve(sigMember));

    const reply = await sigService.updateSigInfo(pullFormatQuery);

    // Assert sig find.
    expect(sigFindOneMock.mock.calls.length).toBe(1);
    expect(sigFindOneMock.mock.calls[0][0]).toStrictEqual({
      where: { name: newSigInfo.name },
    });

    // Assert sig save.
    expect(sigSaveMock.mock.calls.length).toBe(1);
    expect(sigSaveMock.mock.calls[0][0].name).toStrictEqual(sig.name);

    // Assert contributor find.
    expect(contributorFindOneMock.mock.calls.length).toBe(1);
    expect(contributorFindOneMock.mock.calls[0][0]).toStrictEqual({
      where: { github: newSigInfo.techLeaders[0].githubName },
    });

    // Assert contributor save.
    expect(contributorSaveMock.mock.calls.length).toBe(1);
    expect(contributorSaveMock.mock.calls[0][0].name).toStrictEqual(
      contributorInfo.name
    );

    // Assert sig member save.
    expect(sigMemberSaveMock.mock.calls.length).toBe(1);
    expect(sigMemberSaveMock.mock.calls[0][0]).toStrictEqual(sigMember);

    // Assert sig member remove.
    expect(sigMemberRemoveMock.mock.calls.length).toBe(1);
    expect(sigMemberRemoveMock.mock.calls[0][0]).toStrictEqual([]);

    // Assert reply.
    expect(reply).not.toBe(null);
    expect(reply!.status).toBe(Status.Success);
  });

  test("get a sig", async () => {
    const sigMembersWithLevel: Member[] = [
      {
        githubName: "Rustin-Liu1",
        level: "leader",
      },
      {
        githubName: "Rustin-Liu2",
        level: "co-leader",
      },
      {
        githubName: "Rustin-Liu3",
        level: "committer",
      },
      {
        githubName: "Rustin-Liu4",
        level: "reviewer",
      },
      {
        githubName: "Rustin-Liu5",
        level: "active-contributor",
      },
    ];
    const sigName = "test";

    // Mock find sig and return sig
    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    const sig = new Sig();
    sig.id = 1;
    sig.name = sigName;
    sigFindOneMock.mockReturnValue(Promise.resolve(sig));

    const listMembersMock = jest.spyOn(
      sigMemberRepository,
      "listMembersAndCount"
    );
    listMembersMock.mockReturnValue(
      Promise.resolve([sigMembersWithLevel, sigMembersWithLevel.length])
    );

    const sigRes = await sigService.getSig(sigName);

    expect(sigRes.status).toBe(StatusCodes.OK);
    expect(sigRes.message).toBe(SigMessage.GetSigSuccess);
    expect(sigRes.data!.name).toBe(sigName);
    expect(sigRes.data!.membership.techLeaders[0]).toBe(sigMembersWithLevel[0]);
  });

  test("get a sig when sig not found", async () => {
    const sigName = "test";

    // Mock find sig and return sig
    const sigFindOneMock = jest.spyOn(sigRepository, "findOne");
    sigFindOneMock.mockReturnValue(Promise.resolve(undefined));

    const sigRes = await sigService.getSig(sigName);

    expect(sigRes.status).toBe(StatusCodes.NOT_FOUND);
    expect(sigRes.message).toBe(SigMessage.NotFound);
  });

  test("list all sigs without paginate query", async () => {
    // Mock find and count.
    const sigs: Sig[] = [
      {
        id: 1003,
        name: "test",
        info: "info",
        sigUrl: "url",
        createTime: new Date("2020-08-27T03:18:51.000Z"),
        channel: "channel",
        updateTime: new Date("2020-08-27T03:18:51.000Z"),
        status: 0,
        lgtm: 2,
      },
      {
        id: 1004,
        name: "test1",
        info: "info",
        sigUrl: "url",
        createTime: new Date("2020-08-27T03:18:51.000Z"),
        channel: "channel",
        updateTime: new Date("2020-08-27T03:18:51.000Z"),
        status: 0,
        lgtm: 2,
      },
    ];
    const sigFindOneMock = jest.spyOn(sigRepository, "find");
    sigFindOneMock.mockReturnValue(Promise.resolve(sigs));

    const res = await sigService.listSigs();

    expect(res.data.sigs.length).toBe(sigs.length);
    expect(res.data.total).toBe(sigs.length);
    expect(res.status).toBe(StatusCodes.OK);
    expect(res.message).toBe(SigMessage.ListSigsSuccess);
  });

  test("list all sigs with query", async () => {
    // Mock find and count.
    const sigs: Sig[] = [
      {
        id: 1003,
        name: "test",
        info: "info",
        sigUrl: "url",
        createTime: new Date("2020-08-27T03:18:51.000Z"),
        channel: "channel",
        updateTime: new Date("2020-08-27T03:18:51.000Z"),
        status: 0,
        lgtm: 2,
      },
      {
        id: 1004,
        name: "test1",
        info: "info",
        sigUrl: "url",
        createTime: new Date("2020-08-27T03:18:51.000Z"),
        channel: "channel",
        updateTime: new Date("2020-08-27T03:18:51.000Z"),
        status: 0,
        lgtm: 2,
      },
    ];
    const sigFindOneMock = jest.spyOn(sigRepository, "findAndCount");
    sigFindOneMock.mockImplementation((options) => {
      // @ts-ignore
      const { skip, take } = options;

      return Promise.resolve([sigs.slice(skip, take), sigs.length]);
    });

    // One sig each page.
    let res = await sigService.listSigs({
      current: 1,
      pageSize: 1,
    });

    expect(res.data.sigs.length).toBe(1);
    expect(res.data.total).toBe(2);
    expect(res.status).toBe(StatusCodes.OK);
    expect(res.message).toBe(SigMessage.ListSigsSuccess);

    // Two sigs each page.
    res = await sigService.listSigs({
      current: 1,
      pageSize: 2,
    });

    expect(res.data.sigs.length).toBe(2);
    expect(res.data.total).toBe(2);
    expect(res.status).toBe(StatusCodes.OK);
    expect(res.message).toBe(SigMessage.ListSigsSuccess);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
