import axios from "axios";
import MockAdapter from "axios-mock-adapter";

import { SigInfoSchema } from "../../../src/config/SigInfoSchema";
import {
  gatherContributorsWithLevel,
  getSigInfo,
} from "../../../src/services/utils/SigInfoUtils";
import { SigMemberLevel } from "../../../src/db/entities/SigMember";
import { StatusCodes } from "http-status-codes";

describe("Sig Info Util", () => {
  const sigInfo: SigInfoSchema = {
    name: "Test",
    techLeaders: [
      {
        githubId: "Rustin-Liu",
      },
    ],
    coLeaders: [],
    committers: [],
    reviewers: [],
    activeContributors: [
      {
        githubId: "random",
      },
    ],
  };
  test("gather contributors with level ", () => {
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
});
