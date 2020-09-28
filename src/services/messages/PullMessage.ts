import sigInfoSchema from "../../config/sig.info.schema.json";

export enum PullMessage {
  FormatSuccess = "Format Success.",
  OnlyOneRole = "Contributors can only have one role.",
  ConfigNotFound = "The community bot configuration file could not be found.",
  InstallationIdNotFound = "The installation ID could not be found.",
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

export function contributorHasMultipleRoleWarning(githubId: string) {
  return `${githubId} has multiple roles.`;
}
