import sigInfoSchema from "../../config/sig.info.schema.json";

export enum PullMessage {
  CheckFormatPassed = "SIG relationship file format check passed. The SIG information will be updated when the PRs are merged.",
  ContributorCanOnlyHaveOneRole = "Contributor can only have one role in each SIG, so please check if you have added the same contributor more than once.",
  CanNotModifyMultipleSigsFiles = "Currently, the robot cannot modify the relationship files of multiple SIGs in one PR. Please split it into multiple PRs for modification.",
}

export function mustBeJSONFileMessage(fileName: string) {
  return `The \`${fileName}\` file must be a JSON file.`;
}

export function migrateToJSONTip() {
  return `
  You should migrate the current file to a JSON file with the following file format:

  \`\`\`json
  ${JSON.stringify(sigInfoSchema, null, 4)}
  \`\`\`

  `;
}

export function mustMatchSchemaMessage(fileName: string) {
  return `The \`${fileName}\` file must conform to [the schema of the membership file](https://raw.githubusercontent.com/ti-community-infra/ti-community-bot/master/src/config/sig.info.schema.json).`;
}

export function contributorHasMultipleRoleWarning(githubName: string) {
  return `${githubName} has multiple roles.`;
}
