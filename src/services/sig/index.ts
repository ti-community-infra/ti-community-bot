import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import assert from "assert";
import { Repository } from "typeorm";

import { Sig } from "../../db/entities/Sig";
import { SigMember } from "../../db/entities/SigMember";
import { ContributorInfo } from "../../db/entities/ContributorInfo";
import { PullFormatQuery } from "../../queries/PullFormatQuery";
import { Reply, Status } from "../reply";
import { FileStatus } from "../pull";
import { ContributorSchema, SigInfoSchema } from "../../config/SigInfoSchema";
import { SigMessage } from "../messages/SigMessage";
import { gatherContributorsWithLevel, getSigInfo } from "../utils/SigInfoUtils";
import { MAX_SIG_INFO_FILE_CHANGE_NUMBER } from "../../config/Config";
import { Response } from "../response";
import { SigDetailsDTO } from "../dtos/SigDetailsDTO";
import { StatusCodes } from "http-status-codes";
import SigMemberRepository from "../../repositoies/sig-member";
import { SigMemberLevel } from "../member";
import { SigsDTO } from "../dtos/SigsDTO";
import { PaginateQuery } from "../../queries/PaginateQuery";
import SigRepository from "../../repositoies/sig";

const lodash = require("lodash");

export interface SigBasicInfo {
  id: number;
  name: string;
  info: string;
  sigUrl: string;
  channel: string;
  membersCount: number;
  needsLGTM: number;
}

export interface ISigService {
  getSig(sigName: string): Promise<Response<SigDetailsDTO | null>>;
  listSigs(paginateQuery?: PaginateQuery): Promise<Response<SigsDTO>>;
  updateSigInfo(pullFormatQuery: PullFormatQuery): Promise<Reply<null> | null>;
}

@Service()
export class SigService implements ISigService {
  constructor(
    @InjectRepository()
    private sigRepository: SigRepository,
    @InjectRepository()
    private sigMemberRepository: SigMemberRepository,
    @InjectRepository(ContributorInfo)
    private contributorInfoRepository: Repository<ContributorInfo>
  ) {}

  /**
   * Find or add a sig.
   * @param sigInfo
   * @private
   */
  private async findOrAddSig(sigInfo: SigInfoSchema): Promise<Sig> {
    let sig = await this.sigRepository.findOne({
      where: {
        name: sigInfo.name,
      },
    });

    if (sig === undefined) {
      sig = new Sig();
      sig.name = sigInfo.name;
    }

    return await this.sigRepository.save(sig);
  }

  /**
   * Update or add contributors.
   * @param contributorsInfo Contributors info.
   * @private
   */
  private async updateOrAddContributors(
    contributorsInfo: ContributorSchema[]
  ): Promise<ContributorInfo[]> {
    const contributors = [];

    for (let i = 0; i < contributorsInfo.length; i++) {
      const contributorInfo = contributorsInfo[i];
      let contributor = await this.contributorInfoRepository.findOne({
        where: {
          github: contributorInfo.githubName,
        },
      });

      if (contributor === undefined) {
        contributor = new ContributorInfo();
        contributor.github = contributorInfo.githubName;
      }

      contributors.push(await this.contributorInfoRepository.save(contributor));
    }

    return contributors;
  }

  /**
   * Update SIG info when PR merged.
   * @param pullFormatQuery
   */
  public async updateSigInfo(
    pullFormatQuery: PullFormatQuery
  ): Promise<Reply<null> | null> {
    // Filter sig file name.
    const files = pullFormatQuery.files.filter((f) => {
      return (
        f.filename.toLowerCase().includes(pullFormatQuery.sigInfoFileName) &&
        f.status !== FileStatus.Removed // Ignore when the file removed.
      );
    });

    if (files.length === 0) {
      return null;
    }

    // Get sig info from github.
    const sigInfoFile = files[MAX_SIG_INFO_FILE_CHANGE_NUMBER - 1];
    const sigInfo = await getSigInfo(sigInfoFile.raw_url);

    // Gather contributors info.
    const contributorsInfo = gatherContributorsWithLevel(sigInfo);
    const contributorsInfoMap = new Map(
      contributorsInfo.map((c) => [c.githubName, c])
    );
    const contributors = await this.updateOrAddContributors(contributorsInfo);
    assert(contributorsInfo.length === contributors.length);

    const sig = await this.findOrAddSig(sigInfo);
    const sigMembers = await this.sigMemberRepository.find({
      where: {
        sigId: sig.id,
      },
    });
    const sigMembersMap = new Map(sigMembers.map((s) => [s.contributorId, s]));

    for (let j = 0; j < contributors.length; j++) {
      const contributor = contributors[j];
      let sigMember = sigMembersMap.get(contributor.id);

      if (sigMember === undefined) {
        sigMember = new SigMember();
        sigMember.sigId = sig.id;
        sigMember.contributorId = contributor.id;
      }

      sigMember.level = contributorsInfoMap.get(contributor.github)!.level;
      await this.sigMemberRepository.save(sigMember);
      // Delete it after use.
      sigMembersMap.delete(contributor.id);
    }

    // Remove needs delete members.
    const needsDeleteMembers = Array.from(sigMembersMap.values());
    await this.sigMemberRepository.remove(needsDeleteMembers);

    return {
      data: null,
      status: Status.Success,
      message: SigMessage.SigMembershipUpdateSuccess,
    };
  }

  /**
   * Get SIG by SIG's name.
   * @param sigName
   */
  public async getSig(
    sigName: string
  ): Promise<Response<SigDetailsDTO | null>> {
    const sig = await this.sigRepository.findOne({
      where: {
        name: sigName,
      },
    });

    if (sig === undefined) {
      return {
        data: null,
        status: StatusCodes.NOT_FOUND,
        message: SigMessage.SigNotFound,
      };
    }

    const [sigMembers] = await this.sigMemberRepository.listMembersAndCount({
      sigId: sig.id,
    });
    const members = lodash.groupBy(sigMembers, "level");

    return {
      data: {
        name: sig.name,
        membership: {
          techLeaders: members[SigMemberLevel.techLeaders],
          coLeaders: members[SigMemberLevel.coLeaders],
          committers: members[SigMemberLevel.committers],
          reviewers: members[SigMemberLevel.reviewers],
          activeContributors: members[SigMemberLevel.activeContributors],
        },
        needsLGTM: sig.lgtm,
      },
      status: StatusCodes.OK,
      message: SigMessage.GetSigSuccess,
    };
  }

  /**
   * List all public SIGs.
   * @param paginateQuery
   */
  public async listSigs(
    paginateQuery?: PaginateQuery
  ): Promise<Response<SigsDTO>> {
    // If there is no paging query parameter then all sigs are listed.
    if (paginateQuery === undefined) {
      const [sigs, count] = await this.sigRepository.listSigsAndCount();

      return {
        data: {
          sigs,
          total: count,
        },
        status: StatusCodes.OK,
        message: SigMessage.ListSigsSuccess,
      };
    } else {
      const { current, pageSize } = paginateQuery;
      const skip = (current - 1) * pageSize;

      const [sigs, count] = await this.sigRepository.listSigsAndCount(
        skip,
        pageSize
      );

      return {
        data: {
          sigs,
          total: count,
        },
        status: StatusCodes.OK,
        message: SigMessage.ListSigsSuccess,
      };
    }
  }
}
