import { PullFileQuery } from "./PullFileQuery";
import { ContributorSchema } from "../config/SigInfoSchema";
import { LabelQuery } from "./LabelQuery";

export interface PullOwnersQuery {
  sigInfoFileName: string;
  files: PullFileQuery[];
  labels: LabelQuery[];
  maintainers: ContributorSchema[];
  collaborators: ContributorSchema[];
}
