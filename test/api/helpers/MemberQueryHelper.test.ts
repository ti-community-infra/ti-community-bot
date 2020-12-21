import {
  validateMemberLevel,
  validateSigId,
} from "../../../src/api/helpers/MemberQueryHelper";

describe("Member Query Helper", () => {
  test("valid member level", () => {
    const levels = [
      "leader",
      "co-leader",
      "committer",
      "reviewer",
      "active-contributor",
    ];

    levels.forEach((l) => {
      const isValid = validateMemberLevel(l);
      expect(isValid).toBe(true);
    });
  });

  test("invalid member level", () => {
    const validator = () => {
      validateMemberLevel("random-level");
    };

    expect(validator).toThrow();
  });

  test("valid sigId", () => {
    const isValid = validateSigId("1");

    expect(isValid).toBe(true);
  });

  test("invalid sigId", () => {
    const validator = () => {
      validateSigId("random-sigId");
    };

    expect(validator).toThrow();
  });
});
