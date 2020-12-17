import axios from "axios";
import MockAdapter from "axios-mock-adapter";

import { SigInfoSchema } from "../../../src/config/SigInfoSchema";
import {
  findSigNameByLabels,
  gatherContributorsWithLevel,
  getSigInfo,
} from "../../../src/services/utils/SigInfoUtils";
import { SigMemberLevel } from "../../../src/db/entities/SigMember";
import { StatusCodes } from "http-status-codes";
import { LabelQuery } from "../../../src/queries/LabelQuery";

describe("Sig Info Util", () => {
  const sigInfo: SigInfoSchema = {
    name: "Test",
    techLeaders: [
      {
        githubName: "Rustin-Liu",
      },
    ],
    coLeaders: [],
    committers: [],
    reviewers: [],
    activeContributors: [
      {
        githubName: "random",
      },
    ],
  };

  test("gather contributor with level ", () => {
    const contributorsWithLevel = gatherContributorsWithLevel(sigInfo);

    expect(contributorsWithLevel.length).toBe(2);
    expect(contributorsWithLevel[0].level).toBe(SigMemberLevel.techLeaders);
    expect(contributorsWithLevel[1].level).toBe(
      SigMemberLevel.activeContributors
    );
  });

  test("get sig info from URL", async () => {
    const url = "https://mock/test";
    const mock = new MockAdapter(axios);
    mock.onGet(url).reply(StatusCodes.OK, JSON.stringify(sigInfo));
    expect(await getSigInfo(url)).toStrictEqual(sigInfo);
  });

  test("find sig name by labels", async () => {
    const labels: LabelQuery[] = [
      {
        id: 1,
        name: "random",
        description: "random",
        default: false,
      },
      {
        id: 2,
        name: "sig/test",
        description: "random",
        default: false,
      },
      {
        id: 3,
        name: "random",
        description: "random",
        default: false,
      },
    ];

    const sig = findSigNameByLabels(labels);

    expect(sig).toBe("test");
  });
});
