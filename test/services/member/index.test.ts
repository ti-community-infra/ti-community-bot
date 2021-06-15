import MemberService from "../../../src/services/member";
import SigMemberRepository from "../../../src/repositoies/sig-member";

describe("Member Service", () => {
  let memberService: MemberService;
  let memberRepository: SigMemberRepository;
  let listMembersMock;

  // Fake members.
  const members = [
    {
      sigId: 1,
      githubName: "member1",
      level: "leader",
    },
    {
      sigId: 1,
      githubName: "member2",
      level: "co-leader",
    },
    {
      sigId: 1,
      githubName: "member3",
      level: "committer",
    },
    {
      sigId: 2,
      githubName: "member4",
      level: "committer",
    },
    {
      sigId: 2,
      githubName: "member5",
      level: "reviewer",
    },
  ];

  beforeEach(() => {
    // Construct service.
    memberRepository = new SigMemberRepository();
    memberService = new MemberService(memberRepository);

    // Mock the list contributors.
    listMembersMock = jest.spyOn(memberRepository, "listMembersAndCount");

    listMembersMock.mockImplementation((query?, offset?, limit?) => {
      const filteredMembers = members.filter((m) => {
        if (query?.sigId !== undefined) {
          if (m.sigId !== query.sigId) {
            return false;
          }
        }

        if (query?.level !== undefined) {
          if (m.level !== query.level) {
            return false;
          }
        }
        return true;
      });

      if (offset === undefined || limit === undefined) {
        return Promise.resolve([filteredMembers, filteredMembers.length]);
      } else {
        return Promise.resolve([
          filteredMembers.slice(offset, offset + limit),
          filteredMembers.length,
        ]);
      }
    });
  });

  test("list all members without query", async () => {
    const res = await memberService.listMembers(undefined, undefined);

    expect(res.data.total).toBe(members.length);
    expect(res.data.members.length).toStrictEqual(members.length);
  });

  test("list members with paginate query", async () => {
    // One member per page.
    let res = await memberService.listMembers(undefined, {
      current: 1,
      pageSize: 1,
    });

    expect(res.data.total).toBe(members.length);
    expect(res.data.members.length).toStrictEqual(1);

    // One member per page and request a fourth page.
    res = await memberService.listMembers(undefined, {
      current: 4,
      pageSize: 1,
    });

    expect(res.data.total).toBe(members.length);
    expect(res.data.members.length).toStrictEqual(1);

    // Two members per page and request a second page.
    res = await memberService.listMembers(undefined, {
      current: 2,
      pageSize: 2,
    });

    expect(res.data.total).toBe(members.length);
    expect(res.data.members.length).toStrictEqual(2);
  });

  test("list members with member level query", async () => {
    // sigId query.
    let res = await memberService.listMembers({
      sigId: 1,
    });

    expect(res.data.total).toBe(3);
    expect(res.data.members.length).toStrictEqual(3);

    // level query.
    res = await memberService.listMembers({
      level: "committer",
    });

    expect(res.data.total).toBe(2);
    expect(res.data.members.length).toStrictEqual(2);
  });

  test("list members with member level and paginate queries", async () => {
    const paginateQuery = { current: 1, pageSize: 1 };

    // sigId query.
    let res = await memberService.listMembers(
      {
        sigId: 1,
      },
      paginateQuery
    );

    expect(res.data.total).toBe(3);
    expect(res.data.members.length).toStrictEqual(1);

    // level query.
    res = await memberService.listMembers(
      {
        level: "committer",
      },
      paginateQuery
    );

    expect(res.data.total).toBe(2);
    expect(res.data.members.length).toStrictEqual(1);
  });
});
