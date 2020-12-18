import { Entity, Index, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "pulls" })
export class Pull {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ default: null })
  owner: string;

  @Column({ default: null })
  repo: string;

  @Column({ name: "pull_number", default: null })
  @Index()
  pullNumber: number;

  @Column({ type: "text" })
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ default: null })
  user: string;

  @Column({ default: null })
  association: string;

  @Column({ default: null })
  relation: string;

  @Column({ type: "text" })
  label: string;

  @Column({ type: "varchar", length: 128 })
  status: string;

  // FIXME: maybe this means issue created time.
  @Column({
    name: "created_at",
    type: "timestamp",
    nullable: false,
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: string;

  @Column({
    name: "updated_at",
    type: "timestamp",
    nullable: true,
    default: null,
  })
  updatedAt: string;

  @Column({
    name: "closed_at",
    type: "timestamp",
    nullable: true,
    default: null,
  })
  closedAt: string;

  @Column({
    name: "merged_at",
    type: "timestamp",
    nullable: true,
    default: null,
  })
  mergedAt: string;
}
