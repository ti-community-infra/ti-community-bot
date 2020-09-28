import { SigInfoSchema } from "../../config/SigInfoSchema";
import { SigMemberLevel } from "../../db/entities/SigMember";

export interface ContributorInfoWithLevel {
  // TODO: clarify githubId and github.
  githubId: string;
  level: string;
  email?: string;
  company?: string;
}

export function collectContributorsByLevel(
  sigInfo: SigInfoSchema
): ContributorInfoWithLevel[] {
  const contributorInfos: ContributorInfoWithLevel[] = [];

  Object.keys(sigInfo).forEach((key) => {
    Object.keys(SigMemberLevel).forEach((memberLevelKey) => {
      if (key === memberLevelKey) {
        const contributors = sigInfo[key];
        if (Array.isArray(contributors)) {
          contributors.forEach((c) => {
            contributorInfos.push({
              githubId: c.githubId,
              level:
                SigMemberLevel[memberLevelKey as keyof typeof SigMemberLevel],
              email: c.email,
              company: c.company,
            });
          });
        }
      }
    });
  });
  return contributorInfos;
}
