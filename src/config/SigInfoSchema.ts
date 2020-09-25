export interface ContributorSchema {
  githubId: string;
  email?: string;
  company?: string;
}

export interface SigInfoSchema {
  name: string;
  techLeaders: ContributorSchema[];
  coLeaders: ContributorSchema[];
  committers: ContributorSchema[];
  reviewers: ContributorSchema[];
  activeContributors: ContributorSchema[];
}

export enum SigMemberLevelKey {
  Leader = "techLeaders",
  CoLeader = "coLeaders",
  Committer = "committers",
  Reviewer = "reviewers",
  ActiveContributor = "activeContributors",
}
