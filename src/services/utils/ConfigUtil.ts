import { Endpoints } from "@octokit/types";
import merge from "deepmerge";
import yaml from "js-yaml";
import { ProbotOctokit } from "probot/lib/octokit/probot-octokit";
import path from "path";

export type MergeOptions = merge.Options;
type ReposGetContentsParams = Endpoints["GET /repos/:owner/:repo/contents/:path"]["parameters"];

const CONFIG_PATH = ".github";
const DEFAULT_BASE = ".github";
const BASE_KEY = "_extends";
const BASE_REGEX = new RegExp(
  "^" +
    "(?:([a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38})/)?" + // org
    "([-_.\\w\\d]+)" + // project
    "(?::([-_./\\w\\d]+\\.ya?ml))?" + // filename
    "$",
  "i"
);

async function loadYaml(
  params: ReposGetContentsParams,
  github: InstanceType<typeof ProbotOctokit>
): Promise<any> {
  try {
    // https://docs.github.com/en/rest/reference/repos#get-repository-content
    const response = await github.request(
      "GET /repos/{owner}/{repo}/contents/{path}",
      params
    );

    // Ignore in case path is a folder
    // - https://developer.github.com/v3/repos/contents/#response-if-content-is-a-directory
    if (Array.isArray(response.data)) {
      return null;
    }

    // we don't handle symlinks or submodule
    // - https://developer.github.com/v3/repos/contents/#response-if-content-is-a-symlink
    // - https://developer.github.com/v3/repos/contents/#response-if-content-is-a-submodule
    // tslint:disable-next-line
    if (typeof response.data.content !== "string") {
      return;
    }

    return (
      yaml.safeLoad(Buffer.from(response.data.content, "base64").toString()) ||
      {}
    );
  } catch (e) {
    if (e.status === 404) {
      return null;
    }

    throw e;
  }
}

function getBaseParams(
  params: ReposGetContentsParams,
  base: string
): ReposGetContentsParams {
  const match = base.match(BASE_REGEX);
  if (match === null) {
    throw new Error(`Invalid repository name in key "${BASE_KEY}": ${base}`);
  }

  return {
    owner: match[1] || params.owner,
    path: match[3] || params.path,
    repo: match[2],
  };
}

export async function config<T>(
  owner: string,
  repo: string,
  fileName: string,
  github: InstanceType<typeof ProbotOctokit>,
  defaultConfig?: T,
  deepMergeOptions?: MergeOptions
): Promise<T | null> {
  const params = {
    owner,
    repo,
    path: path.posix.join(CONFIG_PATH, fileName),
  };

  const config = await loadYaml(params, github);

  let baseRepo;
  if (config == null) {
    baseRepo = DEFAULT_BASE;
  } else if (config != null && BASE_KEY in config) {
    baseRepo = config[BASE_KEY];
    delete config[BASE_KEY];
  }

  let baseConfig;
  if (baseRepo) {
    if (typeof baseRepo !== "string") {
      throw new Error(`Invalid repository name in key "${BASE_KEY}"`);
    }

    const baseParams = getBaseParams(params, baseRepo);
    baseConfig = await loadYaml(baseParams, github);
  }

  if (config == null && baseConfig == null && !defaultConfig) {
    return null;
  }

  return (merge.all(
    // filter out null configs
    [defaultConfig, baseConfig, config].filter((conf) => conf),
    deepMergeOptions
  ) as unknown) as T;
}
