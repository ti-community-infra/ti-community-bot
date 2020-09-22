interface ContributorSchema {
  githubId: string;
  email?: string;
  company?: string;
}

export interface SigMembersSchema {
  techLeaders: ContributorSchema[];
  committers: ContributorSchema[];
  reviewers: ContributorSchema[];
  activeContributors: ContributorSchema[];
}
