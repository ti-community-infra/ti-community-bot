import { PullFileQuery } from "./PullFileQuery";

export interface PullFormatQuery {
  sigMembersFileName: string;
  files: PullFileQuery[];
}
