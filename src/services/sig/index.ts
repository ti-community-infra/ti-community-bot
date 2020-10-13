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
import { gatherContributorsWithLevel } from "../utils/SigInfoUtils";
import { MAX_SIG_INFO_FILE_CHANGE_NUMBER } from "../../config/Config";

const axios = require("axios").default;

@Service()
export class SigService {
  constructor(
    @InjectRepository(Sig)
    private sigRepository: Repository<Sig>,
    @InjectRepository(SigMember)
    private sigMemberRepository: Repository<SigMember>,
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
      await this.sigRepository.save(sig);
    }

    return sig;
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
          github: contributorInfo.githubId,
        },
      });

      if (contributor === undefined) {
        contributor = new ContributorInfo();
        contributor.github = contributorInfo.githubId;
      }
      contributor.email = contributorInfo.email;
      contributor.company = contributorInfo.company;
      await this.contributorInfoRepository.save(contributor);
      contributors.push(contributor);
    }

    return contributors;
  }

  /**
   * Delete sig members.
   * @param sigId
   * @private
   */
  private async deleteSigMembers(sigId: number) {
    await this.sigMemberRepository.query(
      `delete from sig_member where sig_id = '${sigId}'`
    );
  }

  /**
   * Update sig info when PR merged.
   * It will delete all members and add members from the sig info file.
   * @param pullRequestFormatQuery
   */
  public async updateSigInfo(
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

    const sigInfoFile = files[MAX_SIG_INFO_FILE_CHANGE_NUMBER - 1];

    const { data: sigInfo } = await axios.get(sigInfoFile.raw_url);
    const sig = await this.findOrAddSig(sigInfo);
    const contributorsInfo = gatherContributorsWithLevel(sigInfo);

    const contributorsInfoMap = new Map(
      contributorsInfo.map((c) => [c.githubId, c])
    );

    const contributors = await this.updateOrAddContributors(contributorsInfo);
    assert(contributorsInfo.length === contributors.length);

    await this.deleteSigMembers(sig.id);
    for (let j = 0; j < contributors.length; j++) {
      const contributor = contributors[j];
      let sigMember = await this.sigMemberRepository.findOne({
        where: {
          sigId: sig.id,
          contributorId: contributor.id,
        },
      });

      if (sigMember === undefined) {
        sigMember = new SigMember();
        sigMember.sigId = sig.id;
        sigMember.contributorId = contributor.id;
      }

      sigMember.level = contributorsInfoMap.get(contributor.github)!.level;
      await this.sigMemberRepository.save(sigMember);
    }

    return {
      data: null,
      status: Status.Success,
      message: SigMessage.UpdateSuccess,
    };
  }
}
