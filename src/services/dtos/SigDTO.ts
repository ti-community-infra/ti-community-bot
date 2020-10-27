export interface SigDTO {
  name: string;
  membership: {
    techLeaders: string[];
    coLeaders: string[];
    committers: string[];
    reviewers: string[];
    activeContributors: string[];
  };
  needsLGTM: number;
}
