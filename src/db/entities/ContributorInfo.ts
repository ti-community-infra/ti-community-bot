import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "contributor_info" })
export class ContributorInfo {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ default: null, unique: true })
  github: string;

  @Column({ default: null })
  name: string;

  @Column({ type: "varchar", default: null })
  email?: string | null;

  @Column({ default: null })
  location: string;

  @Column({ default: null })
  tel: string;

  @Column({ default: null })
  other: string;

  @Column({ type: "varchar", default: null })
  company?: string | null;

  @Column({ default: null })
  tp: string;
}
