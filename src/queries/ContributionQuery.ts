export interface ContributionQuery {
  startDate?: Date;
  endDate?: Date;
  orderBy: string;
}

export enum Order {
  Count = "count",
  Score = "score",
}
