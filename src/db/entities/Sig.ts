import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

// FIXME: it should be sigs.
@Entity({ name: "sig" })
export class Sig {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ nullable: true, default: null, unique: true })
  name: string;

  @Column({ nullable: true, default: null })
  info: string;

  @Column({ name: "sig_url", nullable: true, default: null })
  sigUrl: string;

  @Column({
    name: "create_time",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP",
  })
  createTime: Date;

  @Column({ nullable: true, default: null })
  channel: string;

  @Column({
    name: "update_time",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP",
  })
  updateTime: Date;

  @Column({ nullable: false, default: 0 })
  status: number;

  @Column({ nullable: true, default: 2 })
  lgtm: number;
}
