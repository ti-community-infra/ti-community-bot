import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "contributor_info" })
export class ContributorInfo {
  @PrimaryGeneratedColumn({ name: "id" })
  id: number;

  @Column({ default: null, unique: true })
  github: string;

  @Column({ default: null })
  name: string;

  @Column({ default: null })
  email: string;

  @Column({ default: null })
  location: string;

  @Column({ default: null })
  tel: string;

  @Column({ default: null })
  other: string;

  @Column({ default: null })
  company: string;

  @Column({ default: null })
  tp: string;
}
