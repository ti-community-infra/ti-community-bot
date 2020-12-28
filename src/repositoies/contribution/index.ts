import { EntityRepository } from "typeorm";
import { Service } from "typedi";
import { Repository } from "typeorm/repository/Repository";

import { Pull } from "../../db/entities/Pull";
import { ContributionQuery } from "../../queries/ContributionQuery";
import { ChallengePull } from "../../db/entities/ChallengePull";
import { ContributorInfo } from "../../db/entities/ContributorInfo";
import { SigMember } from "../../db/entities/SigMember";
import { Sig } from "../../db/entities/Sig";
import { Contribution } from "../../services/statistics";

@Service()
@EntityRepository(Pull)
export default class ContributionRepository extends Repository<Pull> {
  public async listContributionsAndCount(
    _?: ContributionQuery,
    offset?: number,
    limit?: number
  ): Promise<[Contribution[], number]> {
    const contributions = await this.createQueryBuilder()
      .select(
        "contributions.githubName, contributions.prCount, contributions.score, GROUP_CONCAT(DISTINCT sig.name) as sigs"
      )
      .from((sub) => {
        return sub
          .select(
            "p.user as githubName, count(p.id) as prCount, sum(cp.reward) as score"
          )
          .from(Pull, "p")
          .leftJoin(ChallengePull, "cp", "p.id = cp.pull_id")
          .where("p.status = 'merged'")
          .groupBy("p.user");
      }, "contributions")
      .leftJoin(ContributorInfo, "ci", "ci.github = contributions.githubName")
      .leftJoin(SigMember, "sm", "sm.contributor_id = ci.id")
      .leftJoin(Sig, "sig", "sig.id = sm.sig_id")
      .groupBy("contributions.githubName")
      .offset(offset)
      .limit(limit)
      .getRawMany();

    const { total } = await this.createQueryBuilder("p")
      .leftJoin(ChallengePull, "cp", "p.id = cp.pull_id")
      .select("count(distinct p.user) as total")
      .where("p.status = 'merged'")
      .groupBy("p.user")
      .getRawOne();

    return [contributions, total];
  }
}
