export interface ContributorsDTO {
  contributors: ContributorDTO[];
  total: number;
}

interface ContributorDTO {
  githubName: string;
}
