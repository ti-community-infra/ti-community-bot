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
  /**
   * List members and get count.
   * @param memberQuery
   * @param offset
   * @param limit
   */
  public async listMembersAndCount(
    memberQuery?: MemberQuery,
    offset?: number,
    limit?: number
  ): Promise<[Member[], number]> {
    const sigMemberAlias = "sm";
    const select = "ci.github as githubName, sm.level as level";
    const wheres = memberQuery
      ? Object.keys(memberQuery)
          .map((k) => {
            if (memberQuery[k] !== undefined) {
              if (typeof memberQuery[k] === "string") {
                return `${sigMemberAlias}.${k} = '${memberQuery[k]}'`;
              } else {
                return `${sigMemberAlias}.${k} = ${memberQuery[k]}`;
              }
            }
            return undefined;
          })
          .filter((m) => {
            return m !== undefined;
          })
          .join(" and ")
      : "";

    const members = (
      await this.createQueryBuilder("sm")
        .leftJoin(Sig, "s", "sm.sig_id = s.id")
        .leftJoin(ContributorInfo, "ci", "sm.contributor_id = ci.id")
        .select(select)
        .where(wheres)
        .orderBy("sm.create_time", "ASC")
        .offset(offset)
        .limit(limit)
        .getRawMany()
    ).map((c) => {
      return {
        ...c,
      };
    });

    const count = (
      await this.createQueryBuilder("sm")
        .leftJoin(Sig, "s", "sm.sig_id = s.id")
        .leftJoin(ContributorInfo, "ci", "sm.contributor_id = ci.id")
        .select(`count(*) as total`)
        .where(wheres)
        .getRawOne()
    ).total;

    return [members, count];
  }
}
