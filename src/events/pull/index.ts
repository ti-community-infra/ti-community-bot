import { Context } from "probot";
import PullService from "../../services/pull";
import { PullFormatQuery } from "../../queries/PullFormatQuery";
import { PullFileQuery } from "../../queries/PullFileQuery";
import {
  Config,
  DEFAULT_CONFIG_FILE_PATH,
  DEFAULT_SIG_MEMBERS_FILE_NAME,
} from "../../config/Config";
import Ajv from "ajv";

import sigMembersSchema from "../../config/sig.members.schema.json";
import { Status } from "../../services/reply";
import { combineReplay } from "../../services/utils/ReplyUtil";

// NOTICE: compile schema.
const ajv = Ajv();
const validate = ajv.compile(sigMembersSchema);

enum PullRequestActions {
  Opened = "opened",
  Edited = "edited",
  Labeled = "labeled",
  Unlabeled = "unlabeled",
  Closed = "closed",
  Reopened = "reopened",
}

const checkFormat = async (
  context: Context,
  pullRequestFormatService: PullService
) => {
  const { head, number } = context.payload.pull_request;

  const { data: filesData } = await context.github.pulls.listFiles({
    ...context.issue(),
    pull_number: number,
  });

  const files: PullFileQuery[] = filesData.map((f) => {
    return {
      ...f,
    };
  });

  // NOTICE: get config from repo.
  const config = await context.config<Config>(DEFAULT_CONFIG_FILE_PATH);

  const pullRequestFormatQuery: PullFormatQuery = {
    sigMembersFileName:
      config?.sigMembersFileName || DEFAULT_SIG_MEMBERS_FILE_NAME,
    files,
  };

  const reply = await pullRequestFormatService.formatting(
    validate,
    pullRequestFormatQuery
  );

  const status = {
    sha: head.sha,
    state: reply.status === Status.Success ? "success" : "failure",
    target_url: "https://github.com/tidb-community-bots/ti-community-bot",
    description: reply.message,
    context: "Sig Members File Format",
  };

  switch (reply.status) {
    case Status.Failed: {
      context.log.error("Format failed.", files);
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
      // @ts-ignore
      await context.github.repos.createStatus({
        ...context.repo(),
        ...status,
      });
      break;
    }
    case Status.Problematic: {
      context.log.warn("Format has some problems.", files);
      await context.github.issues.createComment(
        context.issue({ body: combineReplay(reply) })
      );
      // @ts-ignore
      await context.github.repos.createStatus({
        ...context.repo(),
        ...status,
      });
      break;
    }
  }
};

const handlePullRequestEvents = async (
  context: Context,
  pullRequestFormatService: PullService
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
      await checkFormat(context, pullRequestFormatService);
      break;
    }
  }
};

export default handlePullRequestEvents;
