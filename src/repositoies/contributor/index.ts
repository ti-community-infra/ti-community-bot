import { EntityRepository } from "typeorm";
import { Service } from "typedi";
import { Repository } from "typeorm/repository/Repository";

import { Pull } from "../../db/entities/Pull";

@Service()
@EntityRepository(Pull)
export default class ContributorRepository extends Repository<Pull> {
  /**
   * List contributors.
   */
  public async listContributors(
    skip?: number,
    take?: number
  ): Promise<string[]> {
    return (
      await this.createQueryBuilder()
        .select("distinct user as githubName")
        .skip(skip)
        .take(take)
        .getRawMany()
    ).map((c) => {
      return c.githubName;
    });
  }
}
