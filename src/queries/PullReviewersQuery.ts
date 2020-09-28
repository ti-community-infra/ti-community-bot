import { PullFileQuery } from "./PullFileQuery";
import { ContributorSchema } from "../config/SigInfoSchema";

export interface PullReviewersQuery {
  sigInfoFileName: string;
  files: PullFileQuery[];
  maintainers: ContributorSchema[];
  collaborators: ContributorSchema[];
}
