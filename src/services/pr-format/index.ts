import { PullRequestFormatQuery } from "../../queries/PullRequestFormatQuery";
import { Reply, Status } from "../reply";
import { DEFAULT_SIG_FILE_EXT } from "../../config/Config";
import { ValidateFunction } from "ajv";

const axios = require("axios").default;

export default class PullRequestFormatService {
  public async format(
    validate: ValidateFunction,
    pullRequestFormatQuery: PullRequestFormatQuery
  ): Promise<Reply<null>> {
    const files = pullRequestFormatQuery.files.filter((f) => {
      return f.filename
        .toLowerCase()
        .includes(pullRequestFormatQuery.sigFileName);
    });

    const illegalFilesExt = files.filter((f) => {
      return !f.filename.includes(DEFAULT_SIG_FILE_EXT);
    });

    if (illegalFilesExt.length > 0) {
      return {
        data: null,
        status: Status.Failed,
        message: "The file must be json.",
      };
    }

    for (let i = 0; i < files.length; i++) {
      const file = await axios.get(files[i].raw_url);
      if (!validate(file)) {
        return {
          data: null,
          status: Status.Failed,
          message: "The file must match the schema.",
        };
      }
    }

    return {
      data: null,
      status: Status.Success,
      message: "Format Success",
    };
  }
}
