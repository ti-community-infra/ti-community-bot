export interface ContributorSchema {
  githubId: string;
  email?: string;
  company?: string;
}

export interface SigInfoSchema {
  [index: string]: string | ContributorSchema[];
  name: string;
  techLeaders: ContributorSchema[];
  coLeaders: ContributorSchema[];
  committers: ContributorSchema[];
  reviewers: ContributorSchema[];
  activeContributors: ContributorSchema[];
}
