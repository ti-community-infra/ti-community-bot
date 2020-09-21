import { PullRequestFileQuery } from "./PullRequestFileQuery";

export interface PullRequestFormatQuery {
  sigFileName: string;
  files: PullRequestFileQuery[];
}
