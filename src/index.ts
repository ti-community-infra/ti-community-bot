import { Application, Context } from "probot";
import { Container } from "typedi";
import { createConnection, useContainer } from "typeorm";
import "reflect-metadata";

import handlePullRequestEvents from "./events/pull";
import PullService from "./services/pull";
import { SigService } from "./services/sig";
import listReviewers from "./api/permission";
import { StatusCodes } from "http-status-codes";
import { PullMessage } from "./services/messages/PullMessage";

const commands = require("probot-commands-pro");
const bodyParser = require("body-parser");
const cors = require("cors");

export = (app: Application) => {
  useContainer(Container);

  // Get an express router to expose new HTTP endpoints.
  const router = app.route("/ti-community-bot");
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

      router.get(
        "/repos/:owner/:repo/pulls/:number/reviewers",
        async (req, res) => {
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

          const github = await app.auth(installationId);
          await listReviewers(req, res, Container.get(PullService), github);
        }
      );
    })
    .catch((err) => {
      app.log.fatal("Connect to db failed", err);
    });
};
