import { PaginateQuery } from "../../queries/PaginateQuery";
import { Response } from "../response";
import { MemberQuery } from "../../queries/MemberQuery";
import { MembersDTO } from "../dtos/MembersDTO";
import { Service } from "typedi";
import { InjectRepository } from "typeorm-typedi-extensions";
import SigMemberRepository from "../../repositoies/sig-member";
import { StatusCodes } from "http-status-codes";
import { ContributorMessage } from "../messages/ContributorMessage";

export interface Member {
  githubName: string;
  level: string;
}

export enum SigMemberLevel {
  techLeaders = "leader",
  coLeaders = "co-leader",
  committers = "committer",
  reviewers = "reviewer",
  activeContributors = "active-contributor",
}

export interface IMemberService {
  listMembers(
    memberQuery?: MemberQuery,
    paginateQuery?: PaginateQuery
  ): Promise<Response<MembersDTO>>;
}

@Service()
export default class MemberService implements IMemberService {
  constructor(
    @InjectRepository()
    private sigMemberRepository: SigMemberRepository
  ) {}

  public async listMembers(
    memberQuery?: MemberQuery,
    paginateQuery?: PaginateQuery
  ): Promise<Response<MembersDTO>> {
    if (paginateQuery === undefined) {
      const [
        members,
        total,
      ] = await this.sigMemberRepository.listMembersAndCount(memberQuery);
      return {
        data: {
          members,
          total,
        },
        status: StatusCodes.OK,
        message: ContributorMessage.ListContributorSuccess,
      };
    } else {
      const { current, pageSize } = paginateQuery;
      const offset = (current - 1) * pageSize;
      const [
        members,
        total,
      ] = await this.sigMemberRepository.listMembersAndCount(
        memberQuery,
        offset,
        pageSize
      );
      return {
        data: {
          members,
          total,
        },
        status: StatusCodes.OK,
        message: ContributorMessage.ListContributorSuccess,
      };
    }
  }
}
