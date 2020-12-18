import { EntityRepository } from "typeorm";
import { Service } from "typedi";
import { Repository } from "typeorm/repository/Repository";
import { SigMember } from "../../db/entities/SigMember";
import { ContributorInfoWithLevel } from "../../services/utils/SigInfoUtils";
import { Sig } from "../../db/entities/Sig";
import { ContributorInfo } from "../../db/entities/ContributorInfo";

@Service()
@EntityRepository(SigMember)
export default class SigMemberRepository extends Repository<SigMember> {
  /**
   * List sig members.
   * @param sigId SIG id.
   */
  public async listSigMembers(
    sigId: number
  ): Promise<ContributorInfoWithLevel[]> {
    return (
      await this.createQueryBuilder("sm")
        .leftJoinAndSelect(Sig, "s", "sm.sig_id = s.id")
        .leftJoinAndSelect(ContributorInfo, "ci", "sm.contributor_id = ci.id")
        .where(`sig_id = ${sigId}`)
        .select(
          "ci.github as githubName, sm.level as level, ci.email as email, ci.company as company"
        )
        .getRawMany()
    ).map((c) => {
      return {
        ...c,
      };
    });
  }
}
