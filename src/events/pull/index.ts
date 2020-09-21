import { Context } from "probot";
import PullRequestFormatService from "../../services/pr-format";
import { PullRequestFormatQuery } from "../../queries/PullRequestFormatQuery";
import { PullRequestFileQuery } from "../../queries/PullRequestFileQuery";
import {
  Config,
  DEFAULT_CONFIG_FILE_PATH,
  DEFAULT_SIG_FILE_NAME,
} from "../../config/Config";
import Ajv from "ajv";

import sigSchema from "../../config/sig.schema.json";
import { Status } from "../../services/reply";
import { combineReplay } from "../../services/utils/ReplyUtil";

const ajv = Ajv();
const validate = ajv.compile(sigSchema);

enum PullRequestActions {
  // eslint-disable-next-line no-unused-vars
  Opened = "opened",
  // eslint-disable-next-line no-unused-vars
  Edited = "edited",
  // eslint-disable-next-line no-unused-vars
  Labeled = "labeled",
  // eslint-disable-next-line no-unused-vars
  Unlabeled = "unlabeled",
  // eslint-disable-next-line no-unused-vars
  Closed = "closed",
  // eslint-disable-next-line no-unused-vars
  Reopened = "reopened",
}

const handleFormat = async (
  context: Context,
  pullRequestFormatService: PullRequestFormatService
) => {
  const { head, number } = context.payload.pull_request;

  const { data: filesData } = await context.github.pulls.listFiles({
    ...context.issue(),
    pull_number: number,
  });

  const files: PullRequestFileQuery[] = filesData.map((f) => {
    return {
      ...f,
    };
  });

  const config = await context.config<Config>(DEFAULT_CONFIG_FILE_PATH);

  const pullRequestFormatQuery: PullRequestFormatQuery = {
    sigFileName: config?.sigFileName || DEFAULT_SIG_FILE_NAME,
    files,
  };

  const reply = await pullRequestFormatService.format(
    validate,
    pullRequestFormatQuery
  );

  const status = {
    sha: head.sha,
    state: reply.status === Status.Success ? "success" : "failure",
    target_url: "https://github.com/tidb-community-bots/ti-community-bot",
    description: reply.message,
    context: "Sig File Format",
  };

  switch (reply.status) {
    case Status.Failed: {
      // TODO: add log.
      await context.github.issues.createComment(
        context.issue({ body: reply.message })
      );
      // @ts-ignore
      await context.github.repos.createStatus({
        ...context.repo(),
        ...status,
      });
      break;
    }
    case Status.Success: {
      await context.github.issues.createComment(
        context.issue({ body: reply.message })
      );
      // @ts-ignore
      await context.github.repos.createStatus({
        ...context.repo(),
        ...status,
      });
      break;
    }
    case Status.Problematic: {
      await context.github.issues.createComment(
        context.issue({ body: combineReplay(reply) })
      );
      break;
    }
  }
};

const handlePullRequestEvents = async (
  context: Context,
  pullRequestFormatService: PullRequestFormatService
) => {
  switch (context.payload.action) {
    case PullRequestActions.Closed: {
      break;
    }
    case PullRequestActions.Labeled: {
      break;
    }
    case PullRequestActions.Unlabeled: {
      break;
    }
    default: {
      await handleFormat(context, pullRequestFormatService);
      break;
    }
  }
};

export default handlePullRequestEvents;
