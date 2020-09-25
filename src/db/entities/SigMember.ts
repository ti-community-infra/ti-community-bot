import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

export enum SigMemberLevel {
  Leader = "leader",
  Committer = "committer",
  Reviewer = "reviewer",
  ActiveContributor = "active-contributor",
}

// FIXME: it should be sig_members.
@Entity({ name: "sig_member" })
@Unique("sig_id", ["sigId", "contributorId"])
export class SigMember {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ name: "sig_id", default: null })
  sigId: number;

  @Column({ name: "contributor_id", default: null })
  contributorId: number;

  @Column({ default: null })
  level: string;

  @Column({
    name: "create_time",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP",
  })
  createTime: Date;

  @Column({
    name: "update_time",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP",
  })
  updateTime: Date;

  @Column({ nullable: false, default: 0 })
  status: number;
}
