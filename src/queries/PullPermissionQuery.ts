import { PullFileQuery } from "./PullFileQuery";
import { ContributorSchema } from "../config/SigInfoSchema";

export interface PullPermissionQuery {
  sigInfoFileName: string;
  files: PullFileQuery[];
  maintainers: ContributorSchema[];
  collaborators: ContributorSchema[];
}
