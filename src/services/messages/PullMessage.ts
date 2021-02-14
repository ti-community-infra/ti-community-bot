import sigInfoSchema from "../../config/sig.info.schema.json";

export enum PullMessage {
  FormatSuccess = "Sig file formatting success.",
  OnlyOneRole = "Contributors can only have one role.",
  ConfigNotFound = "The community bot configuration file could not be found.",
  InstallationIdNotFound = "The installation ID could not be found.",
  CanNotHandleMultipleSigFiles = "Cannot handle the permissions of multiple sig info files.",
  ListReviewersSuccess = "List reviewers success.",
  CanNotModifyMultipleSigFiles = "Cannot modify multiple sig info files in one PR.",
}

export function mustBeJSONFileMessage(fileName: string) {
  return `The \`${fileName}\` must be a json file.`;
}

export function mustMatchSchemaMessage(fileName: string) {
  // TODO: add url.
  return `The \`${fileName}\` must match the schema.`;
}

export function migrateToJSONTip() {
  return `
  You should migrate the current file to a json file, the file format is as follows:

  \`\`\`json
  ${JSON.stringify(sigInfoSchema, null, 4)}
  \`\`\`

  `;
}

export function contributorHasMultipleRoleWarning(githubName: string) {
  return `${githubName} has multiple roles.`;
}
