export interface ContributorSchema {
  githubId: string;
  email?: string;
  company?: string;
}

export interface SigInfoSchema {
  name: string;
  techLeaders: ContributorSchema[];
  committers: ContributorSchema[];
  reviewers: ContributorSchema[];
  activeContributors: ContributorSchema[];
}

export enum SigMemberLevelKey {
  Leader = "techLeaders",
  Committer = "committers",
  Reviewer = "reviewers",
  ActiveContributor = "activeContributors",
}
