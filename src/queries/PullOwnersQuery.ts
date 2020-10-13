import { PullFileQuery } from "./PullFileQuery";
import { ContributorSchema } from "../config/SigInfoSchema";

export interface PullOwnersQuery {
  sigInfoFileName: string;
  files: PullFileQuery[];
  maintainers: ContributorSchema[];
  collaborators: ContributorSchema[];
}
