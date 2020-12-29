import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { StatusCodes } from "http-status-codes";

import { PaginateQuery } from "../../queries/PaginateQuery";
import { Response } from "../response";
import { ContributionQuery } from "../../queries/ContributionQuery";
import { ContributionsDTO } from "../dtos/ContributionsDTO";
import ContributionRepository from "../../repositoies/contribution";
import { StatisticsMessage } from "../messages/StatisticsMessage";

/**
 * Contribution info.
 */
export interface Contribution {
  githubName: string;
  /**
   * PR total count.
   */
  prCount: number;
  /**
   * Challenge program total score.
   */
  score: number;
  /**
   * The user's sigs.
   */
  sigs: string;
}

export interface IStatisticsService {
  /**
   * List all contributions.
   * @param contributionQuery
   * @param paginateQuery
   */
  listContributions(
    contributionQuery: ContributionQuery,
    paginateQuery?: PaginateQuery
  ): Promise<Response<ContributionsDTO>>;
}

@Service()
export default class StatisticsService implements IStatisticsService {
  constructor(
    @InjectRepository()
    private contributionRepository: ContributionRepository
  ) {}

  public async listContributions(
    contributionQuery: ContributionQuery,
    paginateQuery?: PaginateQuery
  ): Promise<Response<ContributionsDTO>> {
    // No paginate.
    if (paginateQuery === undefined) {
      const [
        contributions,
        total,
      ] = await this.contributionRepository.listContributionsAndCount(
        contributionQuery
      );

      return {
        data: { contributions, total },
        status: StatusCodes.OK,
        message: StatisticsMessage.ListContributionsSuccess,
      };
    } else {
      const { current, pageSize } = paginateQuery;
      const offset = (current - 1) * pageSize;

      const [
        contributions,
        total,
      ] = await this.contributionRepository.listContributionsAndCount(
        contributionQuery,
        offset,
        pageSize
      );

      return {
        data: { contributions, total },
        status: StatusCodes.OK,
        message: StatisticsMessage.ListContributionsSuccess,
      };
    }
  }
}
