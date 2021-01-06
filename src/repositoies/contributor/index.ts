import { EntityRepository } from "typeorm";
import { Service } from "typedi";
import { Repository } from "typeorm/repository/Repository";

import { Pull } from "../../db/entities/Pull";

@Service()
@EntityRepository(Pull)
export default class ContributorRepository extends Repository<Pull> {
  /**
   * List contributors and get count.
   */
  public async listContributorsAndCount(
    offset?: number,
    limit?: number
  ): Promise<[string[], number]> {
    const contributors = (
      await this.manager.connection
        .createQueryBuilder()
        .select("distinct contributors.user as githubName")
        .from((sub) => {
          return sub
            .select("user,created_at")
            .from(Pull, "pull")
            .where(
              "user not in ('ti-srebot', 'sre-bot', 'ti-community-prow-bot', 'dependabot[bot]')"
            );
        }, "contributors")
        .orderBy("created_at", "DESC")
        .offset(offset)
        .limit(limit)
        .getRawMany()
    ).map((c) => {
      return c.githubName;
    });

    const total = (
      await this.createQueryBuilder()
        .select("count(distinct user) as total")
        .where(
          "user not in ('ti-srebot', 'sre-bot', 'ti-community-prow-bot', 'dependabot[bot]')"
        )
        .getRawOne()
    ).total;

    return [contributors, total];
  }
}
