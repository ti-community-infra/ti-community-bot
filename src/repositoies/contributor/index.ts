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
      await this.createQueryBuilder()
        .select("distinct user as githubName")
        .offset(offset)
        .limit(limit)
        .getRawMany()
    ).map((c) => {
      return c.githubName;
    });

    const total = (
      await this.createQueryBuilder()
        .select("count(distinct user) as total")
        .getRawOne()
    ).total;

    return [contributors, total];
  }
}
