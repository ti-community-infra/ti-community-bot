import { PullFormatQuery } from "../../queries/PullFormatQuery";
import { Reply, Status } from "../reply";
import { DEFAULT_SIG_MEMBERS_FILE_EXT } from "../../config/Config";
import { ValidateFunction } from "ajv";
import {
  contributorHasMultipleRoleWarning,
  mustBeJSONFileMessage,
  mustMatchSchemaMessage,
  PullFormatMessage,
  migrateToJSONTip,
} from "../messages/PullFormatMessage";
import { Service } from "typedi";
import { SigMembersSchema } from "../../config/SigMembersSchema";

const axios = require("axios").default;

enum FileStatus {
  Added = "added",
  Modified = "modified",
}

@Service()
export default class PullFormatService {
  private static checkContributorHasOnlyOneRole(
    sig: SigMembersSchema
  ): string | undefined {
    const contributorsMap = new Set();
    const contributors = Object.values(sig).reduce((a, b) => {
      return a.concat(b);
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
          .includes(pullRequestFormatQuery.sigMembersFileName) &&
        (f.status === FileStatus.Added || f.status === FileStatus.Modified)
      );
    });

    // Filter sig file extension。
    const illegalFilesExt = files.filter((f) => {
      return !f.filename.includes(DEFAULT_SIG_MEMBERS_FILE_EXT);
    });

    if (illegalFilesExt.length > 0) {
      return {
        data: null,
        status: Status.Problematic,
        message: mustBeJSONFileMessage(
          pullRequestFormatQuery.sigMembersFileName
        ),
        tip: migrateToJSONTip(),
      };
    }

    // Check each file format.
    for (let i = 0; i < files.length; i++) {
      const { data: sig } = await axios.get(files[i].raw_url);
      if (!validate(sig)) {
        return {
          data: null,
          status: Status.Problematic,
          message: mustMatchSchemaMessage(
            pullRequestFormatQuery.sigMembersFileName
          ),
          tip: migrateToJSONTip(),
          warning: JSON.stringify(validate.errors),
        };
      }
      const githubId = PullFormatService.checkContributorHasOnlyOneRole(
        <SigMembersSchema>sig
      );
      if (githubId !== undefined) {
        return {
          data: null,
          status: Status.Problematic,
          message: PullFormatMessage.OnlyOneRole,
          warning: contributorHasMultipleRoleWarning(githubId),
        };
      }
    }

    return {
      data: null,
      status: Status.Success,
      message: PullFormatMessage.FormatSuccess,
    };
  }
}
