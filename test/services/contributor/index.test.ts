import ContributorRepository from "../../../src/repositoies/contributor";
import ContributorService from "../../../src/services/contributor";

describe("Contributor Service", () => {
  let contributorService: ContributorService;
  let contributorRepository: ContributorRepository;
  let listContributorsMock;

  // Fake contributors.
  const contributors = [
    "contributor1",
    "contributor2",
    "contributor3",
    "contributor4",
  ];

  beforeEach(() => {
    // Construct service.
    contributorRepository = new ContributorRepository();
    contributorService = new ContributorService(contributorRepository);

    // Mock the list contributors.
    listContributorsMock = jest.spyOn(
      contributorRepository,
      "listContributorsAndCount"
    );
    listContributorsMock.mockImplementation((offset?, limit?) => {
      if (offset === undefined || limit === undefined) {
        return Promise.resolve([contributors, contributors.length]);
      } else {
        return Promise.resolve([
          contributors.slice(offset, offset + limit),
          contributors.length,
        ]);
      }
    });
  });

  test("list all contributors without paginate query", async () => {
    const res = await contributorService.listContributors(undefined);

    expect(res.data.total).toBe(contributors.length);
    expect(res.data.contributors.length).toStrictEqual(contributors.length);
  });

  test("list all contributors with paginate query", async () => {
    // One contributor per page.
    let res = await contributorService.listContributors({
      current: 1,
      pageSize: 1,
    });

    expect(res.data.total).toBe(contributors.length);
    expect(res.data.contributors.length).toStrictEqual(1);

    // One contributor per page and request a fourth page.
    res = await contributorService.listContributors({
      current: 4,
      pageSize: 1,
    });

    expect(res.data.total).toBe(contributors.length);
    expect(res.data.contributors.length).toStrictEqual(1);

    // Two contributors per page and request a second page.
    res = await contributorService.listContributors({
      current: 2,
      pageSize: 2,
    });

    expect(res.data.total).toBe(contributors.length);
    expect(res.data.contributors.length).toStrictEqual(2);
  });
});
