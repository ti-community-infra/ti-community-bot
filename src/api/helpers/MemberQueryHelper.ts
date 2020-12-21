import { SigMemberLevel } from "../../services/member";

export function validateMemberLevel(value?: string) {
  if (value !== undefined) {
    const levels = Object.values(SigMemberLevel);
    const validLevel = levels.find((level) => {
      return level === value;
    });
    if (validLevel === undefined) {
      throw new Error(
        `Illegal member level, only ${levels.join("|")} are supported.`
      );
    }
  }

  return true;
}

export function validateSigId(value?: string) {
  if (value !== undefined) {
    const sigId = Number(value);
    if (!Number.isInteger(sigId) || sigId <= 0) {
      throw new Error("Illegal sig id.");
    }
  }

  return true;
}
