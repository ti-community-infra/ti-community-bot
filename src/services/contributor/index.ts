import { Service } from "typedi";
import { StatusCodes } from "http-status-codes";
import { InjectRepository } from "typeorm-typedi-extensions";

import { Response } from "../response";
import { ContributorsDTO } from "../dtos/ContributorsDTO";
import { PaginateQuery } from "../../queries/PaginateQuery";
import ContributorRepository from "../../repositoies/contributor";
import { ContributorMessage } from "../messages/ContributorMessage";

export interface IContributorService {
  /**
   * List contributors.
   * @param paginateQuery
   */
  listContributors(
    paginateQuery?: PaginateQuery
  ): Promise<Response<ContributorsDTO>>;
}

@Service()
export default class ContributorService implements IContributorService {
  constructor(
    @InjectRepository()
    private contributorRepository: ContributorRepository
  ) {}

  /**
   * List contributors.
   * @param paginateQuery
   */
  public async listContributors(
    paginateQuery?: PaginateQuery
  ): Promise<Response<ContributorsDTO>> {
    if (paginateQuery === undefined) {
      const contributors = (
        await this.contributorRepository.listContributors()
      ).map((c) => {
        return { githubName: c };
      });

      const total = await this.contributorRepository.getContributorsCount();

      return {
        data: { contributors: contributors, total: total },
        status: StatusCodes.OK,
        message: ContributorMessage.ListContributorSuccess,
      };
    } else {
      const { current, pageSize } = paginateQuery;
      const skip = (current - 1) * pageSize;

      const contributors = (
        await this.contributorRepository.listContributors(skip, pageSize)
      ).map((c) => {
        return { githubName: c };
      });

      const total = await this.contributorRepository.getContributorsCount();

      return {
        data: { contributors: contributors, total: total },
        status: StatusCodes.OK,
        message: ContributorMessage.ListContributorSuccess,
      };
    }
  }
}
