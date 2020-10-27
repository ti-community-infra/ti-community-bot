import { Context } from "probot";
import PullService from "../../services/pull";
import { PullFormatQuery } from "../../queries/PullFormatQuery";
import { PullFileQuery } from "../../queries/PullFileQuery";
import {
  Config,
  DEFAULT_CONFIG_FILE_PATH,
  DEFAULT_SIG_INFO_FILE_NAME,
} from "../../config/Config";
import Ajv from "ajv";

import sigInfoSchema from "../../config/sig.info.schema.json";
import { Status } from "../../services/reply";
import { combineReplay } from "../../services/utils/ReplyUtil";
import { SigService } from "../../services/sig";

// NOTICE: compile schema.
const ajv = Ajv();
const validate = ajv.compile(sigInfoSchema);

enum PullRequestActions {
  Opened = "opened",
  Edited = "edited",
  Labeled = "labeled",
  Unlabeled = "unlabeled",
  Closed = "closed",
  Reopened = "reopened",
}

async function constructPullFormatQuery(
  context: Context
): Promise<PullFormatQuery> {
  const { number } = context.payload.pull_request;

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

  return {
    sigInfoFileName: config?.sigInfoFileName || DEFAULT_SIG_INFO_FILE_NAME,
    files,
  };
}

/**
 * Check pull format.
 * @param context Probot context.
 * @param pullService Pull request service.
 */
async function checkPullFormat(context: Context, pullService: PullService) {
  const { head } = context.payload.pull_request;

  const pullFormatQuery = await constructPullFormatQuery(context);

  const reply = await pullService.formatting(validate, pullFormatQuery);

  const status = {
    sha: head.sha,
    state: reply.status === Status.Success ? "success" : "failure",
    target_url: "https://github.com/tidb-community-bots/ti-community-bot",
    description: reply.message,
    context: "Sig Info File Format",
  };

  const { files } = pullFormatQuery;

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
}

async function updateSigInfo(context: Context, sigService: SigService) {
  const pullFormatQuery = await constructPullFormatQuery(context);
  const { files } = pullFormatQuery;

  const reply = await sigService.updateSigInfo(pullFormatQuery);

  if (reply === null) {
    return;
  }

  switch (reply.status) {
    case Status.Failed: {
      context.log.error("Update sig info.", files);
      await context.github.issues.createComment(
        context.issue({ body: reply.message })
      );
      break;
    }
    case Status.Success: {
      context.log.info("Update sig info.", files);
      await context.github.issues.createComment(
        context.issue({ body: reply.message })
      );
      break;
    }
    case Status.Problematic: {
      context.log.warn("Update sig info has some problems.", files);
      await context.github.issues.createComment(
        context.issue({ body: combineReplay(reply) })
      );
    }
  }
}

export async function handlePullRequestEvents(
  context: Context,
  pullRequestFormatService: PullService,
  sigService: SigService
) {
  switch (context.payload.action) {
    case PullRequestActions.Closed: {
      const { merged_at: mergedAt } = context.payload.pull_request;
      // NOTICE: we update sig info when PR merged.
      if (mergedAt) {
        await updateSigInfo(context, sigService);
      }
      break;
    }
    case PullRequestActions.Labeled: {
      break;
    }
    case PullRequestActions.Unlabeled: {
      break;
    }
    default: {
      await checkPullFormat(context, pullRequestFormatService);
      break;
    }
  }
}
