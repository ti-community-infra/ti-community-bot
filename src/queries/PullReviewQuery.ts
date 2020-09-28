import { PullFileQuery } from "./PullFileQuery";
import { ContributorSchema } from "../config/SigInfoSchema";

export interface PullReviewQuery {
  sigInfoFileName: string;
  files: PullFileQuery[];
  maintainers: ContributorSchema[];
  collaborators: ContributorSchema[];
}
