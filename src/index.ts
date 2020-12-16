import { Application, Context } from "probot";
import { Container } from "typedi";
import { createConnection, useContainer } from "typeorm";
import "reflect-metadata";

import PullService from "./services/pull";
import { SigService } from "./services/sig";
import { StatusCodes } from "http-status-codes";
import { PullMessage } from "./services/messages/PullMessage";
import { getSig } from "./api/sig";
import { listOwners } from "./api/pull";
import { handlePullRequestEvents } from "./events/pull";
import { Router } from "express";

const commands = require("probot-commands-pro");
const bodyParser = require("body-parser");
const cors = require("cors");

export = (
  app: Application,
  {
    getRouter,
  }: {
    getRouter: (path?: string) => Router;
  }
) => {
  useContainer(Container);

  // Get an express router to expose new HTTP endpoints.
  const router = getRouter("/ti-community-bot");
  router.use(bodyParser.json());
  router.use(cors());

  // Get app installation id.
  const getInstallationId = async (owner: string): Promise<number | null> => {
    const github = await app.auth();

    const { data: installationInfos } = await github.apps.listInstallations();
    const installations = installationInfos.filter((i) => {
      return i.account.login === owner;
    });

    return installations.length > 0 ? installations[0].id : null;
  };

  createConnection()
    .then(() => {
      app.log.info("App starting...");

      // Ping command.
      commands(app, "ping", async (context: Context) => {
        await context.octokit.issues.createComment(
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

      // Pull request owners API.
      router.get(
        "/repos/:owner/:repo/pulls/:number/owners",
        async (req, res) => {
          // It must installed bot.
          const installationId = await getInstallationId(req.params.owner);

          if (installationId === null) {
            res.status(StatusCodes.BAD_REQUEST);
            const response = {
              data: null,
              status: StatusCodes.BAD_REQUEST,
              message: PullMessage.InstallationIdNotFound,
            };
            res.json(response);

            return;
          }

          // Create github client with installed token.
          const github = await app.auth(installationId);
          await listOwners(req, res, Container.get(PullService), github);
        }
      );

      router.get("/sigs/:name", async (req, res) => {
        await getSig(req, res, Container.get(SigService));
      });
    })
    .catch((err) => {
      app.log.fatal("Connect to db failed", err);
    });
};
