import { PullFormatQuery } from "../../queries/PullFormatQuery";
import { Reply, Status } from "../reply";
import { DEFAULT_SIG_INFO_FILE_EXT } from "../../config/Config";
import { ValidateFunction } from "ajv";
import {
  contributorHasMultipleRoleWarning,
  mustBeJSONFileMessage,
  mustMatchSchemaMessage,
  PullMessage,
  migrateToJSONTip,
} from "../messages/PullMessage";
import { Service } from "typedi";
import { SigInfoSchema } from "../../config/SigInfoSchema";

const axios = require("axios").default;

export enum FileStatus {
  Added = "added",
  Renamed = "renamed",
  Modified = "modified",
  Deleted = "deleted",
}

@Service()
export default class PullService {
  private static checkContributorHasOnlyOneRole(
    sigInfo: SigInfoSchema
  ): string | undefined {
    const contributorsMap = new Set();
    const contributors = Object.values(sigInfo).reduce((a, b) => {
      // FIXME: it should be checked in a more reasonable way.
      if (Array.isArray(a) && Array.isArray(b)) {
        return a.concat(b);
      }
      return [];
    });

    for (let contributor of contributors) {
      if (!contributorsMap.has(contributor.githubId)) {
        contributorsMap.add(contributor.githubId);
      } else {
        return contributor.githubId;
      }
    }
    return;
  }

  /**
   * Format the sig members file.
   * @param validate
   * @param pullRequestFormatQuery
   */
  public async formatting(
    validate: ValidateFunction,
    pullRequestFormatQuery: PullFormatQuery
  ): Promise<Reply<null>> {
    // Filter sig file name.
    const files = pullRequestFormatQuery.files.filter((f) => {
      return (
        f.filename
          .toLowerCase()
          .includes(pullRequestFormatQuery.sigInfoFileName) &&
        f.status !== FileStatus.Deleted // Ignore when the file deleted.
      );
    });

    // Filter sig file extension。
    const illegalFilesExt = files.filter((f) => {
      return !f.filename.includes(DEFAULT_SIG_INFO_FILE_EXT);
    });

    if (illegalFilesExt.length > 0) {
      return {
        data: null,
        status: Status.Problematic,
        message: mustBeJSONFileMessage(pullRequestFormatQuery.sigInfoFileName),
        tip: migrateToJSONTip(),
      };
    }

    // Check each file format.
    for (let i = 0; i < files.length; i++) {
      const { data: sigInfo } = await axios.get(files[i].raw_url);
      if (!validate(sigInfo)) {
        return {
          data: null,
          status: Status.Problematic,
          message: mustMatchSchemaMessage(
            pullRequestFormatQuery.sigInfoFileName
          ),
          tip: migrateToJSONTip(),
          warning: JSON.stringify(validate.errors),
        };
      }
      const githubId = PullService.checkContributorHasOnlyOneRole(
        <SigInfoSchema>sigInfo
      );
      if (githubId !== undefined) {
        return {
          data: null,
          status: Status.Problematic,
          message: PullMessage.OnlyOneRole,
          warning: contributorHasMultipleRoleWarning(githubId),
        };
      }
    }

    return {
      data: null,
      status: Status.Success,
      message: PullMessage.FormatSuccess,
    };
  }
}
