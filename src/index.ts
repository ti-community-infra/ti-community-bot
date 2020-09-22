import { Application, Context } from "probot";
import { Container } from "typedi";
import "reflect-metadata";

import handlePullRequestEvents from "./events/pull";
import PullRequestFormatService from "./services/pr-format";

const commands = require("probot-commands-pro");

export = (app: Application) => {
  commands(app, "ping", async (context: Context) => {
    await context.github.issues.createComment(
      context.issue({ body: "pong! I am community bot." })
    );
  });

  app.on("pull_request", async (context: Context) => {
    await handlePullRequestEvents(
      context,
      Container.get(PullRequestFormatService)
    );
  });
};
