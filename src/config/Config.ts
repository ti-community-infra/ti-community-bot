export interface Config {
  sigInfoFileName?: string;
  maintainerTeamSlug: string;
  afterComment?: string;
}

export const DEFAULT_SIG_INFO_FILE_NAME = "member-list";
export const DEFAULT_CONFIG_FILE_PATH = "community-bot.yml";
export const DEFAULT_SIG_INFO_FILE_EXT = ".json";
export const MAX_SIG_INFO_FILE_CHANGE_NUMBER = 1;
