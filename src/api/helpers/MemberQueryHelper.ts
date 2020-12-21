import { SigMemberLevel } from "../../services/member";

/**
 * Validate member level.
 * Only leader|co-leader|committer|reviewer|active-contributor are supported.
 * @param value
 */
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

/**
 * Validate sig id.
 * @param value
 */
export function validateSigId(value?: string) {
  if (value !== undefined) {
    const sigId = Number(value);
    if (!Number.isInteger(sigId) || sigId <= 0) {
      throw new Error("Illegal sig id.");
    }
  }

  return true;
}
