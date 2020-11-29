import { Request, Response } from "express";
import { ProbotOctokit } from "probot/lib/octokit/probot-octokit";
import { StatusCodes } from "http-status-codes";
import path from "path";

import { PullFileQuery } from "../../queries/PullFileQuery";
import { PullOwnersQuery } from "../../queries/PullOwnersQuery";
import {
  Config,
  DEFAULT_BASE,
  DEFAULT_CONFIG_FILE_PATH,
  DEFAULT_SIG_INFO_FILE_NAME,
} from "../../config/Config";
import { ContributorSchema } from "../../config/SigInfoSchema";
import { PullMessage } from "../../services/messages/PullMessage";
import { IPullService } from "../../services/pull";

export async function listOwners(
  req: Request,
  res: Response,
  pullService: IPullService,
  github: InstanceType<typeof ProbotOctokit>
) {
  // Gather params.
  const owner = req.params.owner;
  const repo = req.params.repo;
  const pullNumber = Number(req.params.number);

  // Get pull request.
  const { data: pullRequest } = await github.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const labels = pullRequest.labels;

  // Get pull request change files.
  const { data: filesData } = await github.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const files: PullFileQuery[] = filesData.map((f) => {
    return {
      ...f,
    };
  });

  // Get config form repo.
  const { config: repoConfig } = await github.config.get({
    owner,
    repo,
    path: path.posix.join(DEFAULT_BASE, DEFAULT_CONFIG_FILE_PATH),
    defaults: {},
  });

  const config = <Config>repoConfig;
  // Because we need this config to get maintainer team.
  if (config === null) {
    res.status(StatusCodes.BAD_REQUEST);
    const response = {
      data: null,
      status: StatusCodes.BAD_REQUEST,
      message: PullMessage.ConfigNotFound,
    };
    res.json(response);

    return;
  }

  // Get maintainers and repo collaborators.
  const { data: maintainerInfos } = await github.teams.listMembersInOrg({
    org: owner,
    team_slug: config.maintainerTeamSlug,
  });

  const maintainers: ContributorSchema[] = maintainerInfos.map((m) => {
    return {
      githubName: m.login,
    };
  });

  // Notice：The `github.paginate` API loads the next page data against the link attribute in response's header
  // TODO: Add paginated test case for the listCollaborators API
  const collaboratorInfos = await github.paginate(
    github.repos.listCollaborators,
    {
      owner,
      repo,
    },
    (res) => res.data
  );

  const collaborators = collaboratorInfos.map((c) => {
    return {
      githubName: c.login,
      permissions: c.permissions,
    };
  });

  const pullReviewersQuery: PullOwnersQuery = {
    sigInfoFileName: config.sigInfoFileName || DEFAULT_SIG_INFO_FILE_NAME,
    maintainers,
    collaborators,
    files,
    labels,
  };

  const response = await pullService.listOwners(pullReviewersQuery);

  res.status(response.status);
  res.json(response);
}
