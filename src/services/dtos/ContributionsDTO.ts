export interface ContributionsDTO {
  contributions: ContributionDTO[];
  total: number;
}

interface ContributionDTO {
  githubName: string;
  prCount: number;
  score: number;
  sigs: string;
}
