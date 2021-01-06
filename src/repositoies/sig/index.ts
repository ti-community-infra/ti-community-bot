import { EntityRepository } from "typeorm";
import { Service } from "typedi";
import { Repository } from "typeorm/repository/Repository";

import { Sig } from "../../db/entities/Sig";
import { SigBasicInfo } from "../../services/sig";
import { SigMember } from "../../db/entities/SigMember";

@Service()
@EntityRepository(Sig)
export default class SigRepository extends Repository<Sig> {
  /**
   * List sigs and total count.
   * @param offset
   * @param limit
   */
  public async listSigsAndCount(
    offset?: number,
    limit?: number
  ): Promise<[SigBasicInfo[], number]> {
    const publicSigStatus = 0;
    const sigs = await this.manager.connection
      .createQueryBuilder()
      .select("*")
      .from((sub) => {
        return sub
          .select("s.id, count(sm.contributor_id) as membersCount")
          .from(Sig, "s")
          .leftJoin(SigMember, "sm", "sm.sig_id = s.id")
          .where(`s.status = ${publicSigStatus}`)
          .groupBy("s.id");
      }, "sig_summary")
      .leftJoin(Sig, "sig", "sig.id = sig_summary.id")
      .orderBy("sig_summary.membersCount", "DESC")
      .offset(offset)
      .limit(limit)
      .getRawMany();

    const count = (
      await this.createQueryBuilder("s")
        .select("count(*) as total")
        .where(`s.status = ${publicSigStatus}`)
        .getRawOne()
    ).total;

    return [sigs, count];
  }
}
