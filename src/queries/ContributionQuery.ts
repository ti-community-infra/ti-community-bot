/**
 * Contribution API query.
 */
export interface ContributionQuery {
  /**
   * Pull request start date.
   */
  startDate?: Date;
  /**
   * Pull request end date.
   */
  endDate?: Date;
  /**
   * Contributions order.
   * Only prCount|score are supported.
   */
  orderBy: string;
}

/**
 * Contribution order.
 */
export enum ContributionOrder {
  Count = "prCount",
  Score = "score",
}
