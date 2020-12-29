import StatisticsService from "../../../src/services/statistics";
import ContributionRepository from "../../../src/repositoies/contribution";
import { ContributionQuery } from "../../../src/queries/ContributionQuery";

describe("Statistics Service", () => {
  let statisticsService: StatisticsService;
  let contributionRepository: ContributionRepository;
  let listContributionsAndCountMock;

  // Fake contributions.
  const contributors = [
    {
      githubName: "contributor1",
      prCount: 10,
      score: 100,
      sigs: "test",
    },
    {
      githubName: "contributor2",
      prCount: 11,
      score: 1000,
      sigs: "test,test1",
    },
    {
      githubName: "contributor3",
      prCount: 1,
      score: 6000,
      sigs: "test1",
    },
    {
      githubName: "contributor4",
      prCount: 1,
      score: 6000,
      sigs: "test1",
    },
    {
      githubName: "contributor5",
      prCount: 1,
      score: 6000,
      sigs: "test1",
    },
    {
      githubName: "contributor6",
      prCount: 1,
      score: 6000,
      sigs: "test1",
    },
  ];

  beforeEach(() => {
    // Construct service.
    contributionRepository = new ContributionRepository();
    statisticsService = new StatisticsService(contributionRepository);

    // Mock the list contributors.
    listContributionsAndCountMock = jest.spyOn(
      contributionRepository,
      "listContributionsAndCount"
    );
    listContributionsAndCountMock.mockImplementation(
      (_: ContributionQuery, offset?, limit?) => {
        if (offset === undefined || limit === undefined) {
          return Promise.resolve([contributors, contributors.length]);
        } else {
          return Promise.resolve([
            contributors.slice(offset, offset + limit),
            contributors.length,
          ]);
        }
      }
    );
  });

  test("list all contributions without paginate query", async () => {
    const res = await statisticsService.listContributions({
      orderBy: "prCount",
    });

    expect(res.data.total).toBe(contributors.length);
    expect(res.data.contributions.length).toStrictEqual(contributors.length);
  });

  test("list all contributions with paginate query", async () => {
    const contributionQuery = {
      orderBy: "prCount",
    };

    // One contribution per page.
    let res = await statisticsService.listContributions(contributionQuery, {
      current: 1,
      pageSize: 1,
    });

    expect(res.data.total).toBe(contributors.length);
    expect(res.data.contributions.length).toStrictEqual(1);

    // One contributions per page and request a fourth page.
    res = await statisticsService.listContributions(contributionQuery, {
      current: 4,
      pageSize: 1,
    });

    expect(res.data.total).toBe(contributors.length);
    expect(res.data.contributions.length).toStrictEqual(1);

    // Two contributions per page and request a second page.
    res = await statisticsService.listContributions(contributionQuery, {
      current: 2,
      pageSize: 2,
    });

    expect(res.data.total).toBe(contributors.length);
    expect(res.data.contributions.length).toStrictEqual(2);
  });
});
