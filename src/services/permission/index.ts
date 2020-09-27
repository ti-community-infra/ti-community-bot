import { Service } from "typedi";
import { PullPermissionQuery } from "../../queries/PullPermissionQuery";
import { Response } from "../response";
import { PullPermissionsDTO } from "../dtos/PullPermissionsDTO";
import { InjectRepository } from "typeorm-typedi-extensions";
import { Repository } from "typeorm";
import { SigMember } from "../../db/entities/SigMember";
import { Sig } from "../../db/entities/Sig";
import { ContributorInfo } from "../../db/entities/ContributorInfo";
import { FileStatus } from "../pull";
import { StatusCodes } from "http-status-codes";
import { SigInfoSchema } from "../../config/SigInfoSchema";
import {
  collectContributorsByLevel,
  ContributorInfoWithLevel,
} from "../utils/SigInfoUtils";

const axios = require("axios").default;

@Service()
export class PermissionService {
  constructor(
    @InjectRepository(Sig)
    private sigRepository: Repository<Sig>,
    @InjectRepository(SigMember)
    private sigMemberRepository: Repository<SigMember>
  ) {}

  private async listSigMembers(
    sigId: number
  ): Promise<ContributorInfoWithLevel[]> {
    return (
      await this.sigMemberRepository
        .createQueryBuilder("sm")
        .leftJoinAndSelect(Sig, "s", "sm.sig_id = s.id")
        .leftJoinAndSelect(ContributorInfo, "ci", "sm.contributor_id = ci.id")
        .where(`sig_id = ${sigId}`)
        .select("ci.github as githubId, sm.level as level")
        .getRawMany()
    ).map((c) => {
      return {
        githubId: c.githubId,
        level: c.level,
      };
    });
  }

  public async listPermissions(
    pullPermissionQuery: PullPermissionQuery
  ): Promise<Response<PullPermissionsDTO | null>> {
    // Filter sig file name.
    const files = pullPermissionQuery.files.filter((f) => {
      return (
        f.filename
          .toLowerCase()
          .includes(pullPermissionQuery.sigInfoFileName) &&
        f.status !== FileStatus.Deleted // Ignore when the file deleted.
      );
    });

    if (files.length > 1) {
      return {
        data: null,
        status: StatusCodes.CONFLICT,
        message: "Cannot multiple community files permissions.",
      };
    }

    if (files.length === 0) {
      const collaborators = pullPermissionQuery.collaborators.map((c) => {
        return c.githubId;
      });
      return {
        data: {
          collaborators,
          lgtmNumber: 2,
        },
        status: StatusCodes.OK,
        message: "List permission success.",
      };
    }

    const { data } = await axios.get(files[0].raw_url);
    const sigInfo = <SigInfoSchema>data;
    const sig = await this.sigRepository.findOne({
      where: {
        name: sigInfo.name,
      },
    });

    if (sig === undefined) {
      const collaborators = pullPermissionQuery.maintainers.map((m) => {
        return m.githubId;
      });
      return {
        data: {
          collaborators,
          lgtmNumber: 2,
        },
        status: StatusCodes.OK,
        message: "List permission success.",
      };
    }

    const oldMembersWithLevel = await this.listSigMembers(sig.id);
    const newMembersWithLevel = collectContributorsByLevel(sigInfo);

    const difference = [...newMembersWithLevel].filter((nm) =>
      [...oldMembersWithLevel].every((om) => om.githubId !== nm.githubId)
    );

    console.log(difference);

    const collaborators = difference.map((c) => {
      return c.githubId;
    });
    return {
      data: {
        collaborators,
        lgtmNumber: 2,
      },
      status: StatusCodes.OK,
      message: "List permission success.",
    };
  }
}
