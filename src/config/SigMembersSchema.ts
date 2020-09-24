interface ContributorSchema {
  githubId: string;
  email?: string;
  company?: string;
}

export interface SigMembersSchema {
  name: string;
  techLeaders: ContributorSchema[];
  committers: ContributorSchema[];
  reviewers: ContributorSchema[];
  activeContributors: ContributorSchema[];
}
