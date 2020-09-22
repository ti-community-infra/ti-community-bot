import { PullFormatQuery } from "../../queries/PullFormatQuery";
import { Reply, Status } from "../reply";
import { DEFAULT_SIG_MEMBERS_FILE_EXT } from "../../config/Config";
import { ValidateFunction } from "ajv";
import {
  contributorHasMultipleRole,
  mustBeJSONFileMessage,
  mustMatchSchema,
  PullRequestFormatMessage,
  PullRequestFormatTip,
} from "../messages/PullRequestFormatMessage";
import { Service } from "typedi";
import { SigMembersSchema } from "../../config/SigMembersSchema";

const axios = require("axios").default;

enum FileStatus {
  Added = "added",
  Modified = "modified",
}

@Service()
export default class PullFormatService {
  public checkContributorHasOnlyOneRole(
    sig: SigMembersSchema
  ): string | undefined {
    const contributorsMap = new Set();
    console.log(Object.values(sig));
    const contributors = Object.values(sig).reduce((a, b) => {
      return a.concat(b);
    });

    for (let contributor of contributors) {
      console.log(contributor);
      if (!contributorsMap.has(contributor.githubId)) {
        contributorsMap.add(contributor.githubId);
      } else {
        return contributor.githubId;
      }
    }
    return;
  }

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
        tip: PullRequestFormatTip.MigrateToJSON,
      };
    }

    // Check each file format.
    for (let i = 0; i < files.length; i++) {
      const { data: sig } = await axios.get(files[i].raw_url);
      if (!validate(sig)) {
        return {
          data: null,
          status: Status.Problematic,
          message: mustMatchSchema(pullRequestFormatQuery.sigMembersFileName),
          tip: PullRequestFormatTip.MigrateToJSON,
          warning: JSON.stringify(validate.errors),
        };
      }
      const githubId = this.checkContributorHasOnlyOneRole(
        <SigMembersSchema>sig
      );
      console.log(githubId);
      if (githubId !== undefined) {
        return {
          data: null,
          status: Status.Problematic,
          message: PullRequestFormatMessage.OnlyOneRole,
          warning: contributorHasMultipleRole(githubId),
        };
      }
    }

    return {
      data: null,
      status: Status.Success,
      message: PullRequestFormatMessage.FormatSuccess,
    };
  }
}
