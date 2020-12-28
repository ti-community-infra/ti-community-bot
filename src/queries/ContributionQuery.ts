export interface ContributionQuery {
  startDate?: Date;
  endDate?: Date;
  orderBy: string;
}

export enum ContributionOrder {
  Count = "prCount",
  Score = "score",
}
