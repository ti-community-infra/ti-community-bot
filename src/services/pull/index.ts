import { ValidateFunction } from "ajv";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { StatusCodes } from "http-status-codes";

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
import { Sig } from "../../db/entities/Sig";
import { SigMemberLevel } from "../../db/entities/SigMember";
import {
  gatherContributorsWithLevel,
  getSigInfo,
  findSigNameByLabels,
} from "../utils/SigInfoUtils";
import { PullOwnersDTO } from "../dtos/PullOwnersDTO";
import { PullOwnersQuery } from "../../queries/PullOwnersQuery";
import { Response } from "../response";
import SigMemberRepository from "../../repositoies/sig-member";
import { PullFileQuery } from "../../queries/PullFileQuery";
import { Member } from "../member";

export interface IPullService {
  listOwners(
    pullReviewQuery: PullOwnersQuery
  ): Promise<Response<PullOwnersDTO | null>>;
}

/**
 * LGTM number.
 */
enum LGTM {
  One = 1,
  Two,
  Three,
}

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
export default class PullService implements IPullService {
  constructor(
    @InjectRepository(Sig)
    private sigRepository: Repository<Sig>,
    @InjectRepository()
    private sigMemberRepository: SigMemberRepository
  ) {}

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
   * Get reviewers by member diff.
   * @param diff Sif members diff.
   * @param oldMembers Sig old members.
   * @param maintainers Repo maintainers.
   * @private
   */
  private getOwnersByDiff(
    diff: Member[],
    oldMembers: Member[],
    maintainers: string[]
  ): PullOwnersDTO | null {
    for (let i = 0; i < diff.length; i++) {
      const contributor = diff[i];
      switch (contributor.level) {
        case SigMemberLevel.techLeaders:
        case SigMemberLevel.coLeaders:
        case SigMemberLevel.committers: {
          return {
            committers: maintainers,
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
                  return c.githubName;
                })
                .concat(maintainers)
            )
          );
          return {
            committers: reviewers,
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
                  return c.githubName;
                })
                .concat(maintainers)
            )
          );
          return {
            committers: reviewers,
            reviewers,
            needsLGTM: LGTM.One,
          };
        }
      }
    }
    const reviewers = Array.from(
      new Set(
        oldMembers
          .filter((om) => om.level !== SigMemberLevel.activeContributors)
          .map((c) => {
            return c.githubName;
          })
          .concat(maintainers)
      )
    );
    return {
      committers: reviewers,
      reviewers,
      needsLGTM: LGTM.One,
    };
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
        f.status !== FileStatus.Removed // Ignore when the file removed.
      );
    });

    // No formatting is required.
    if (files.length === 0) {
      return {
        data: null,
        status: Status.Success,
        message: PullMessage.NoFormatRequired,
      };
    }

    if (files.length > MAX_SIG_INFO_FILE_CHANGE_NUMBER) {
      return {
        data: null,
        status: Status.Failed,
        message: PullMessage.CanNotModifyMultipleSigFiles,
      };
    }

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

    // Check sig ingo file format.
    const sigInfoFile = files[MAX_SIG_INFO_FILE_CHANGE_NUMBER - 1];

    const sigInfo = await getSigInfo(sigInfoFile.raw_url);
    if (!validate(sigInfo)) {
      return {
        data: null,
        status: Status.Problematic,
        message: mustMatchSchemaMessage(pullRequestFormatQuery.sigInfoFileName),
        tip: migrateToJSONTip(),
        warning: JSON.stringify(validate.errors),
      };
    }
    const githubName = PullService.checkContributorHasOnlyOneRole(sigInfo);
    if (githubName !== null) {
      return {
        data: null,
        status: Status.Problematic,
        message: PullMessage.OnlyOneRole,
        warning: contributorHasMultipleRoleWarning(githubName),
      };
    }

    return {
      data: null,
      status: Status.Success,
      message: PullMessage.FormatSuccess,
    };
  }

  /**
   * List legal reviewers for pull request.
   * @param pullOwnersQuery Pull request owners query.
   */
  public async listOwners(
    pullOwnersQuery: PullOwnersQuery
  ): Promise<Response<PullOwnersDTO | null>> {
    // Filter sig file name.
    const files = pullOwnersQuery.files.filter((f) => {
      return (
        f.filename.toLowerCase().includes(pullOwnersQuery.sigInfoFileName) &&
        f.status !== FileStatus.Removed // Notice: because it maybe delete old files.
      );
    });

    // Can not change multiple files at same time.
    if (files.length > MAX_SIG_INFO_FILE_CHANGE_NUMBER) {
      return {
        data: null,
        status: StatusCodes.BAD_REQUEST,
        message: PullMessage.CanNotHandleMultipleSigFiles,
      };
    }

    if (files.length === 0) {
      return this.listOwnersByLabels(pullOwnersQuery);
    } else {
      return this.listOwnersByFiles(pullOwnersQuery, files);
    }
  }

  private async listOwnersByLabels(
    pullOwnersQuery: PullOwnersQuery
  ): Promise<Response<PullOwnersDTO | null>> {
    const sigName = findSigNameByLabels(pullOwnersQuery.labels);
    // Notice: if the sig not found, the reviewer and committer will use the collaborator.
    const collaborators = pullOwnersQuery.collaborators
      .filter((c) => {
        return c.permissions?.admin || c.permissions?.push;
      })
      .map((c) => {
        return c.githubName;
      });

    if (sigName === null) {
      return {
        data: {
          committers: collaborators,
          reviewers: collaborators,
          needsLGTM: LGTM.Two,
        },
        status: StatusCodes.OK,
        message: PullMessage.ListReviewersSuccess,
      };
    }

    // Find sig.
    const sig = await this.sigRepository.findOne({
      where: {
        name: sigName,
      },
    });

    if (sig === undefined) {
      return {
        data: {
          committers: collaborators,
          reviewers: collaborators,
          needsLGTM: LGTM.Two,
        },
        status: StatusCodes.OK,
        message: PullMessage.ListReviewersSuccess,
      };
    } else {
      const sigMembers = await this.sigMemberRepository.listMembers({
        sigId: sig.id,
      });

      const committers = sigMembers
        .filter((m) => {
          return (
            m.level === SigMemberLevel.techLeaders ||
            m.level === SigMemberLevel.coLeaders ||
            m.level === SigMemberLevel.committers
          );
        })
        .map((m) => {
          return m.githubName;
        });

      const reviewers = committers.concat(
        sigMembers
          .filter((m) => {
            return m.level === SigMemberLevel.reviewers;
          })
          .map((m) => {
            return m.githubName;
          })
      );

      return {
        data: {
          committers,
          reviewers,
          needsLGTM: LGTM.Two,
        },
        status: StatusCodes.OK,
        message: PullMessage.ListReviewersSuccess,
      };
    }
  }

  private async listOwnersByFiles(
    pullOwnersQuery: PullOwnersQuery,
    files: PullFileQuery[]
  ): Promise<Response<PullOwnersDTO | null>> {
    const sigInfo = await getSigInfo(
      files[MAX_SIG_INFO_FILE_CHANGE_NUMBER - 1].raw_url
    );

    // Find sig.
    const sig = await this.sigRepository.findOne({
      where: {
        name: sigInfo.name,
      },
    });

    // If the sig is not found, it means a new sig is created, so we ask the maintainers to review the PR.
    if (sig === undefined) {
      const maintainers = pullOwnersQuery.maintainers.map((m) => {
        return m.githubName;
      });
      return {
        data: {
          committers: maintainers,
          reviewers: maintainers,
          needsLGTM: LGTM.Two,
        },
        status: StatusCodes.OK,
        message: PullMessage.ListReviewersSuccess,
      };
    }

    // Get the PR's members diff.
    const oldMembersWithLevel = await this.sigMemberRepository.listMembers({
      sigId: sig.id,
    });
    const newMembersWithLevel = gatherContributorsWithLevel(sigInfo);
    const difference = [...newMembersWithLevel].filter((nm) =>
      [...oldMembersWithLevel].every(
        (om) => !(om.githubName === nm.githubName && om.level === nm.level)
      )
    );

    const ownersDTO = this.getOwnersByDiff(
      difference,
      oldMembersWithLevel,
      pullOwnersQuery.maintainers.map((m) => {
        return m.githubName;
      })
    );

    return {
      data: ownersDTO,
      status: StatusCodes.OK,
      message: PullMessage.ListReviewersSuccess,
    };
  }
}
