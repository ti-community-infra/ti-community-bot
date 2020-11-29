export interface ContributorSchema {
  githubName: string;
  // The optional flag is set for some api returned the contributor without permissions
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
