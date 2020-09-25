import { Application, Context } from "probot";
import { Container } from "typedi";
import { createConnection, useContainer } from "typeorm";
import "reflect-metadata";

import handlePullRequestEvents from "./events/pull";
import PullService from "./services/pull";
import { SigService } from "./services/sig";

const commands = require("probot-commands-pro");

export = (app: Application) => {
  useContainer(Container);

  createConnection()
    .then(() => {
      app.log.info("App starting...");
      commands(app, "ping", async (context: Context) => {
        await context.github.issues.createComment(
          context.issue({ body: "pong! I am community bot." })
        );
      });

      app.on("pull_request", async (context: Context) => {
        await handlePullRequestEvents(
          context,
          Container.get(PullService),
          Container.get(SigService)
        );
      });
    })
    .catch((err) => {
      app.log.fatal("Connect to db failed", err);
    });
};
