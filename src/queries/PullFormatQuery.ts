import { PullFileQuery } from "./PullFileQuery";

export interface PullFormatQuery {
  sigInfoFileName: string;
  files: PullFileQuery[];
}
