export interface ContributorSchema {
  githubName: string;
  permissions?: {
    pull: boolean;
    push: boolean;
    admin: boolean;
  };
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
