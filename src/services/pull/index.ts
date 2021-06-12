import { ValidateFunction } from "ajv";
import { Service } from "typedi";

import {
  contributorHasMultipleRoleWarning,
  mustBeJSONFileMessage,
  mustMatchSchemaMessage,
  PullMessage,
  migrateToJSONTip,
} from "../messages/PullMessage";
import { PullFormatQuery } from "../../queries/PullFormatQuery";
import { Reply, Status } from "../reply";
import {
  DEFAULT_SIG_INFO_FILE_EXT,
  MAX_SIG_INFO_FILE_CHANGE_NUMBER,
} from "../../config/Config";
import { ContributorSchema, SigInfoSchema } from "../../config/SigInfoSchema";
import { getSigInfo } from "../utils/SigInfoUtils";
import {generateReplyMsg} from "../utils/ReplyUtil";

/**
 * Github change file status.
 */
export enum FileStatus {
  Added = "added",
  Renamed = "renamed",
  Modified = "modified",
  Removed = "removed",
}

@Service()
export default class PullService {
  constructor() {}

  /**
   * Check contributor has only on role.
   * @param sigInfo Sig info.
   * @private
   */
  private static checkContributorHasOnlyOneRole(
    sigInfo: SigInfoSchema
  ): string | null {
    const contributorsMap = new Set();

    let contributors: ContributorSchema[] = [];
    Object.values(sigInfo).forEach((value) => {
      if (Array.isArray(value)) {
        contributors = contributors.concat(value);
      }
    });

    for (let contributor of contributors) {
      if (!contributorsMap.has(contributor.githubName)) {
        contributorsMap.add(contributor.githubName);
      } else {
        return contributor.githubName;
      }
    }
    return null;
  }

  /**
   * Check format of the SIG membership file.
   * @param validate
   * @param pullRequestFormatQuery
   */
  public async checkFormatting(
    validate: ValidateFunction,
    pullRequestFormatQuery: PullFormatQuery
  ): Promise<Reply<null> | null> {
    // Filter sig file name.
    const files = pullRequestFormatQuery.files.filter((f) => {
      return (
        f.filename
          .toLowerCase()
          .includes(pullRequestFormatQuery.sigInfoFileName) &&
        f.status !== FileStatus.Removed // Ignore when the file removed.
      );
    });

    // No formatting is required.
    if (files.length === 0) {
      return null;
    }

    if (files.length > MAX_SIG_INFO_FILE_CHANGE_NUMBER) {
      return {
        data: null,
        status: Status.Failed,
        message: PullMessage.CanNotModifyMultipleSigsFiles,
      };
    }

    // Filter sig membership file extension.
    const illegalFilesExt = files.filter((f) => {
      return !f.filename.includes(DEFAULT_SIG_INFO_FILE_EXT);
    });

    if (illegalFilesExt.length > 0) {
      return {
        data: null,
        status: Status.Failed,
        message: generateReplyMsg(mustBeJSONFileMessage(pullRequestFormatQuery.sigInfoFileName),migrateToJSONTip()),
      };
    }

    // Check sig ingo file format.
    const sigInfoFile = files[MAX_SIG_INFO_FILE_CHANGE_NUMBER - 1];

    const sigInfo = await getSigInfo(sigInfoFile.raw_url);
    if (!validate(sigInfo)) {
      let details = `
${migrateToJSONTip()}

Current errors:
\`\`\`json
${JSON.stringify(validate.errors)}
\`\`\`
      `
      return {
        data: null,
        status: Status.Failed,
        message: generateReplyMsg(mustMatchSchemaMessage(pullRequestFormatQuery.sigInfoFileName),details),
      };
    }
    const githubName = PullService.checkContributorHasOnlyOneRole(sigInfo);
    if (githubName !== null) {
      return {
        data: null,
        status: Status.Failed,
        message: generateReplyMsg(PullMessage.ContributorCanOnlyHaveOneRole,contributorHasMultipleRoleWarning(githubName)),
      };
    }

    return {
      data: null,
      status: Status.Success,
      message: PullMessage.CheckFormatPassed,
    };
  }
}
