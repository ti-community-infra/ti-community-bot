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
  /**
   * List contributions and count.
   * @param contributionQuery
   * @param offset
   * @param limit
   */
  public async listContributionsAndCount(
    contributionQuery: ContributionQuery,
    offset?: number,
    limit?: number
  ): Promise<[Contribution[], number]> {
    // Construct where.
    const where = `p.status = 'merged' and p.user not in ('ti-srebot', 'sre-bot', 'ti-community-prow-bot', 'dependabot[bot]') ${
      contributionQuery.startDate !== undefined &&
      contributionQuery.endDate !== undefined
        ? ` and p.created_at >= '${contributionQuery.startDate.toISOString()}' and p.created_at <= '${contributionQuery.endDate.toISOString()}'`
        : ""
    }`;

    const contributions = (
      await this.manager.connection
        .createQueryBuilder()
        .select(
          "contributions.githubName, contributions.prCount, contributions.score, GROUP_CONCAT(DISTINCT sig.name) as sigs"
        )
        .from((sub) => {
          // Get the contributions.
          return sub
            .select(
              "p.user as githubName, count(p.id) as prCount, sum(cp.reward) as score"
            )
            .from(Pull, "p")
            .leftJoin(ChallengePull, "cp", "p.id = cp.pull_id")
            .where(where)
            .groupBy("p.user");
        }, "contributions")
        // Get the sig list of contributors according to their GitHub name.
        .leftJoin(ContributorInfo, "ci", "ci.github = contributions.githubName")
        .leftJoin(SigMember, "sm", "sm.contributor_id = ci.id")
        .leftJoin(Sig, "sig", "sig.id = sm.sig_id")
        .groupBy("contributions.githubName")
        // Order the contributions.
        .orderBy(`contributions.${contributionQuery.orderBy}`, "DESC")
        .offset(offset)
        .limit(limit)
        .getRawMany()
    ).map((c) => {
      return {
        ...c,
        prCount: Number(c.prCount),
        score: Number(c.score),
      };
    });

    const total = Number(
      (
        await this.createQueryBuilder("p")
          .leftJoin(ChallengePull, "cp", "p.id = cp.pull_id")
          .select("p.user")
          .where(where)
          .groupBy("p.user")
          .getRawMany()
      ).length
    );

    return [contributions, total];
  }
}
