import { ApplicationFunctionOptions, Probot, Context } from "probot";
import { Container } from "typedi";
import { createConnection, useContainer } from "typeorm";
import "reflect-metadata";

import PullService from "./services/pull";
import { SigService } from "./services/sig";
import { getSig, listSigs } from "./api/sig";
import { handlePullEvents } from "./events/pull";
import { listContributors } from "./api/contributor";
import ContributorService from "./services/contributor";
import {
  validateCurrent,
  validatePageSize,
} from "./api/helpers/PaginateHelper";
import { listMembers } from "./api/member";
import MemberService from "./services/member";
import {
  validateMemberLevel,
  validateSigId,
} from "./api/helpers/MemberQueryHelper";

const commands = require("probot-commands-pro");
const bodyParser = require("body-parser");
const cors = require("cors");
const { query } = require("express-validator");

export = (app: Probot, { getRouter }: ApplicationFunctionOptions) => {
  useContainer(Container);

  // Get an express router to expose new HTTP endpoints.
  if (!getRouter) {
    app.log.fatal("Failed to obtain getRouter.");
    return;
  }

  // Get an express router to expose new HTTP endpoints.
  const router = getRouter("/ti-community-bot");
  router.use(bodyParser.json());
  router.use(cors());

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
        await handlePullEvents(
          context,
          Container.get(PullService),
          Container.get(SigService)
        );
      });

      router.get(
        "/sigs",
        query("current").custom(validateCurrent),
        query("pageSize").custom(validatePageSize),
        async (req, res) => {
          await listSigs(req, res, Container.get(SigService));
        }
      );

      router.get("/sigs/:name", async (req, res) => {
        await getSig(req, res, Container.get(SigService));
      });

      router.get(
        "/contributors",
        query("current").custom(validateCurrent),
        query("pageSize").custom(validatePageSize),
        async (req, res) => {
          await listContributors(req, res, Container.get(ContributorService));
        }
      );

      router.get(
        "/members",
        query("sigId").custom(validateSigId),
        query("level").custom(validateMemberLevel),
        query("current").custom(validateCurrent),
        query("pageSize").custom(validatePageSize),
        async (req, res) => {
          await listMembers(req, res, Container.get(MemberService));
        }
      );
    })
    .catch((err) => {
      app.log.fatal(err, "Connect to db failed");
      return;
    });
};
