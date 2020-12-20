import { EntityRepository } from "typeorm";
import { Service } from "typedi";
import { Repository } from "typeorm/repository/Repository";
import { SigMember } from "../../db/entities/SigMember";
import { Sig } from "../../db/entities/Sig";
import { ContributorInfo } from "../../db/entities/ContributorInfo";
import { MemberQuery } from "../../queries/MemberQuery";
import { Member } from "../../services/member";

@Service()
@EntityRepository(SigMember)
export default class SigMemberRepository extends Repository<SigMember> {
  public async listMembers(
    memberQuery?: MemberQuery,
    offset?: number,
    limit?: number
  ): Promise<Member[]> {
    return (
      await this.createQueryBuilder("sm")
        .leftJoin(Sig, "s", "sm.sig_id = s.id")
        .leftJoin(ContributorInfo, "ci", "sm.contributor_id = ci.id")
        .select(`ci.github as githubName, sm.level as level`)
        .where(
          `${
            memberQuery
              ? `${
                  memberQuery.sigId !== undefined
                    ? `sm.sig_id = ${memberQuery.sigId}`
                    : ""
                }`
              : ""
          }`
        )
        .where(
          `${
            memberQuery
              ? `${
                  memberQuery.level !== undefined
                    ? `sm.level = '${memberQuery.level}'`
                    : ""
                }`
              : ""
          }`
        )
        .offset(offset)
        .limit(limit)
        .getRawMany()
    ).map((c) => {
      return {
        ...c,
      };
    });
  }
}
