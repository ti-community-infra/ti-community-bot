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
import { ContributorSchema, SigInfoSchema } from "../../config/SigInfoSchema";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Sig } from "../../db/entities/Sig";
import { Repository } from "typeorm";
import { SigMember, SigMemberLevel } from "../../db/entities/SigMember";
import {
  collectContributorsByLevel,
  ContributorInfoWithLevel,
} from "../utils/SigInfoUtils";
import { ContributorInfo } from "../../db/entities/ContributorInfo";
import { PullReviewersDTO } from "../dtos/PullReviewersDTO";
import { PullReviewersQuery } from "../../queries/PullReviewersQuery";
import { Response } from "../response";
import { StatusCodes } from "http-status-codes";

const axios = require("axios").default;
const equal = require("deep-equal");

enum LGTM {
  One = 1,
  Two,
  Three,
}
export enum FileStatus {
  Added = "added",
  Renamed = "renamed",
  Modified = "modified",
  Deleted = "deleted",
}

@Service()
export default class PullService {
  constructor(
    @InjectRepository(Sig)
    private sigRepository: Repository<Sig>,
    @InjectRepository(SigMember)
    private sigMemberRepository: Repository<SigMember>
  ) {}

  private static checkContributorHasOnlyOneRole(
    sigInfo: SigInfoSchema
  ): string | undefined {
    const contributorsMap = new Set();

    let contributors: ContributorSchema[] = [];
    Object.values(sigInfo).forEach((value) => {
      if (Array.isArray(value)) {
        contributors = contributors.concat(value);
      }
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
   * List sig members.
   * @param sigId SIG id.
   * @private
   */
  private async listSigMembers(
    sigId: number
  ): Promise<ContributorInfoWithLevel[]> {
    return (
      await this.sigMemberRepository
        .createQueryBuilder("sm")
        .leftJoinAndSelect(Sig, "s", "sm.sig_id = s.id")
        .leftJoinAndSelect(ContributorInfo, "ci", "sm.contributor_id = ci.id")
        .where(`sig_id = ${sigId}`)
        .select(
          "ci.github as githubId, sm.level as level, ci.email as email, ci.company as company"
        )
        .getRawMany()
    ).map((c) => {
      return {
        githubId: c.githubId,
        level: c.level,
        email: c.email,
        company: c.company,
      };
    });
  }

  /**
   * Get reviewers by member diff.
   * @param diff Sif members diff.
   * @param oldMembers Sig old members.
   * @param maintainers Repo maintainers.
   * @private
   */
  private getReviewersByDiff(
    diff: ContributorInfoWithLevel[],
    oldMembers: ContributorInfoWithLevel[],
    maintainers: string[]
  ): PullReviewersDTO | null {
    for (let i = 0; i < diff.length; i++) {
      const contributor = diff[i];
      switch (contributor.level) {
        case SigMemberLevel.techLeaders:
        case SigMemberLevel.coLeaders:
        case SigMemberLevel.committers: {
          return {
            reviewers: maintainers,
            needsLGTM: LGTM.Two,
          };
        }
        case SigMemberLevel.reviewers: {
          // NOTICE: remove duplicates。
          const reviewers = Array.from(
            new Set(
              oldMembers
                .filter(
                  (om) =>
                    om.level !== SigMemberLevel.reviewers &&
                    om.level !== SigMemberLevel.activeContributors
                )
                .map((c) => {
                  return c.githubId;
                })
                .concat(maintainers)
            )
          );
          return {
            reviewers,
            needsLGTM: LGTM.Two,
          };
        }
        case SigMemberLevel.activeContributors: {
          const reviewers = Array.from(
            new Set(
              oldMembers
                .filter((om) => om.level !== SigMemberLevel.activeContributors)
                .map((c) => {
                  return c.githubId;
                })
                .concat(maintainers)
            )
          );
          return {
            reviewers,
            needsLGTM: LGTM.One,
          };
        }
      }
    }
    return null;
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

  /**
   * List legal reviewers for pull request.
   * @param pullReviewQuery Pull request review query.
   */
  public async listReviewers(
    pullReviewQuery: PullReviewersQuery
  ): Promise<Response<PullReviewersDTO | null>> {
    // Filter sig file name.
    const files = pullReviewQuery.files.filter((f) => {
      return (
        f.filename.toLowerCase().includes(pullReviewQuery.sigInfoFileName) &&
        f.status !== FileStatus.Deleted // Ignore when the file deleted.
      );
    });

    if (files.length > 1) {
      return {
        data: null,
        status: StatusCodes.CONFLICT,
        message: PullMessage.CanNotHandleMultipleSigFiles,
      };
    }

    // Notice: if the sig information file is not changed, the reviewer will use the collaborator.
    const collaborators = pullReviewQuery.collaborators.map((c) => {
      return c.githubId;
    });

    if (files.length === 0) {
      return {
        data: {
          reviewers: collaborators,
          needsLGTM: LGTM.Two,
        },
        status: StatusCodes.OK,
        message: PullMessage.ListReviewersSuccess,
      };
    }

    // Get sig info.
    const { data } = await axios.get(files[0].raw_url);
    const sigInfo = <SigInfoSchema>data;
    // Find sig.
    const sig = await this.sigRepository.findOne({
      where: {
        name: sigInfo.name,
      },
    });

    // If the sig is not found, it means a new sig is created, so we ask the maintainers to review the PR.
    if (sig === undefined) {
      const maintainers = pullReviewQuery.maintainers.map((m) => {
        return m.githubId;
      });
      return {
        data: {
          reviewers: maintainers,
          needsLGTM: LGTM.Two,
        },
        status: StatusCodes.OK,
        message: PullMessage.ListReviewersSuccess,
      };
    }

    // Get the PR's members diff.
    const oldMembersWithLevel = await this.listSigMembers(sig.id);
    const newMembersWithLevel = collectContributorsByLevel(sigInfo);
    const difference = [...newMembersWithLevel].filter((nm) =>
      [...oldMembersWithLevel].every((om) => !equal(om, nm))
    );

    const reviewersDTO = this.getReviewersByDiff(
      difference,
      oldMembersWithLevel,
      pullReviewQuery.maintainers.map((m) => {
        return m.githubId;
      })
    );

    return {
      data: reviewersDTO || {
        reviewers: collaborators,
        needsLGTM: 2,
      },
      status: StatusCodes.OK,
      message: PullMessage.ListReviewersSuccess,
    };
  }
}
