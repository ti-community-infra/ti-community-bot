/**
 * Member API query.
 */
export interface MemberQuery {
  /**
   * The sig id.
   */
  sigId?: number;
  /**
   * The sig member level.
   */
  level?: string;
  [key: string]: any;
}
