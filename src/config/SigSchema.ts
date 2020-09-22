interface ContributorSchema {
  githubId: string;
  email: string;
  company?: string;
}

export interface SigSchema {
  techLeaders: ContributorSchema[];
  committers: ContributorSchema[];
  reviewers: ContributorSchema[];
  activeContributors: ContributorSchema[];
}
