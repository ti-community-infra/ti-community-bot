import axios from "axios";

import { SigInfoSchema } from "../../config/SigInfoSchema";
import { SigMemberLevel } from "../../db/entities/SigMember";

export interface ContributorInfoWithLevel {
  githubName: string;
  level: string;
}

/**
 * Gather contributor info with level.
 * @param sigInfo Sig info.
 */
export function gatherContributorsWithLevel(
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
              level:
                SigMemberLevel[memberLevelKey as keyof typeof SigMemberLevel],
              ...c,
            });
          });
        }
      }
    });
  });
  return contributorInfos;
}

/**
 * Get sig info from remote.
 * @param url
 */
export async function getSigInfo(url: string): Promise<SigInfoSchema> {
  // Get sig info.
  const { data } = await axios.get(url);
  return <SigInfoSchema>data;
}
