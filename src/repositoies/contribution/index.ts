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
    contributionQuery: ContributionQuery,
    offset?: number,
    limit?: number
  ): Promise<[Contribution[], number]> {
    const where = `p.status = 'merged' ${
      contributionQuery.startDate !== undefined &&
      contributionQuery.endDate !== undefined
        ? ` and p.created_at >= '${contributionQuery.startDate.toISOString()}' and p.created_at <= '${contributionQuery.endDate.toISOString()}'`
        : ""
    }`;

    console.log(where);
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
          .where(where)
          .groupBy("p.user");
      }, "contributions")
      .leftJoin(ContributorInfo, "ci", "ci.github = contributions.githubName")
      .leftJoin(SigMember, "sm", "sm.contributor_id = ci.id")
      .leftJoin(Sig, "sig", "sig.id = sm.sig_id")
      .groupBy("contributions.githubName")
      .orderBy(`contributions.${contributionQuery.orderBy}`, "DESC")
      .offset(offset)
      .limit(limit)
      .getRawMany();

    const { total } = await this.createQueryBuilder("p")
      .leftJoin(ChallengePull, "cp", "p.id = cp.pull_id")
      .select("count(p.id) as total")
      .where(where)
      .getRawOne();

    return [contributions, total];
  }
}
