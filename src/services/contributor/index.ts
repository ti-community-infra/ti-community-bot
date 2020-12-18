import { Response } from "../response";
import { ContributorsDTO } from "../dtos/ContributorsDTO";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import { PaginateQuery } from "../../queries/PaginateQuery";
import ContributorRepository from "../../repositoies/contributor";
import { StatusCodes } from "http-status-codes";
import { ContributorMessage } from "../messages/ContributorMessage";

export interface IContributorsService {
  listContributors(
    paginateQuery?: PaginateQuery
  ): Promise<Response<ContributorsDTO>>;
}

@Service()
export default class ContributorsService implements IContributorsService {
  constructor(
    @InjectRepository()
    private contributorRepository: ContributorRepository
  ) {}

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
