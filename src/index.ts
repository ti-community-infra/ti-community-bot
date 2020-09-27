import { Application, Context } from "probot";
import { Container } from "typedi";
import { createConnection, useContainer } from "typeorm";
import "reflect-metadata";

import handlePullRequestEvents from "./events/pull";
import PullService from "./services/pull";
import { SigService } from "./services/sig";
import { PermissionService } from "./services/permission";
import listPermissions from "./api/permission";

const commands = require("probot-commands-pro");
const bodyParser = require("body-parser");
const cors = require("cors");

export = (app: Application) => {
  useContainer(Container);

  // Get an express router to expose new HTTP endpoints.
  const router = app.route("/ti-community-bot");
  router.use(bodyParser.json());
  router.use(cors());

  const getInstallationId = async (
    owner: string
  ): Promise<number | undefined> => {
    const github = await app.auth();
    const { data: installationInfos } = await github.apps.listInstallations();
    const installations = installationInfos.filter((i) => {
      return i.account.login === owner;
    });

    return installations.length > 0 ? installations[0].id : undefined;
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
        "/repos/:owner/:repo/pull/:number/permissions",
        async (req, res) => {
          const installationId = await getInstallationId(req.params.owner);
          // FIXME: check installationId.
          const github = await app.auth(installationId);
          await listPermissions(
            req,
            res,
            Container.get(PermissionService),
            github
          );
        }
      );
    })
    .catch((err) => {
      app.log.fatal("Connect to db failed", err);
    });
};
