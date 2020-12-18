/**
 * Paginate query.
 */
export interface PaginateQuery {
  /**
   * Current page.
   * Start with 1.
   */
  current: number;
  /**
   * Size of each page.
   */
  pageSize: number;
}
