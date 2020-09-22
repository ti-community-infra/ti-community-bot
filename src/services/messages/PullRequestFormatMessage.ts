export enum PullRequestFormatMessage {
  FormatSuccess = "Format Success.",
  OnlyOneRole = "Contributors can only have one role.",
}

export function mustBeJSONFileMessage(fileName: string) {
  return `The \`${fileName}\` must be a json file.`;
}

export function mustMatchSchema(fileName: string) {
  // TODO: add url.
  return `The \`${fileName}\` must match the schema.`;
}

export enum PullRequestFormatTip {
  MigrateToJSON = `
  You should migrate the current file to a json file, the file format is as follows:

\`\`\`json
{
  "type": "object",
  "required": ["TechLeaders", "Committers", "Reviewers", "ActiveContributors"],
  "properties": {
    "TechLeaders": {
      "type": "array",
      "items": {
        "type": "object",
        "required":["GithubId"],
        "properties": {
          "GithubId": {
            "type": "string"
          },
          "Email": {
            "type": "string",
            "format": "email"
          },
          "Company": {
            "type": "string"
          }
        }
      }
    },
    "Committers": {
      "type": "array",
      "items": {
        "type": "object",
        "required":["GithubId"],
        "properties": {
          "GithubId": {
            "type": "string"
          },
          "Email": {
            "type": "string",
            "format": "email"
          },
          "Company": {
            "type": "string"
          }
        }
      }
    },
    "Reviewers": {
      "type": "array",
      "items": {
        "type": "object",
        "required":["GithubId"],
        "properties": {
          "GithubId": {
            "type": "string"
          },
          "Email": {
            "type": "string",
            "format": "email"
          },
          "Company": {
            "type": "string"
          }
        }
      }
    },
    "ActiveContributors": {
      "type": "array",
      "items": {
        "type": "object",
        "required":["GithubId"],
        "properties": {
          "GithubId": {
            "type": "string"
          },
          "Email": {
            "type": "string",
            "format": "email"
          },
          "Company": {
            "type": "string"
          }
        }
      }
    }
  }
}
\`\`\`
  `,
}

export function contributorHasMultipleRole(githubId: string) {
  return `${githubId} has multiple roles.`;
}
