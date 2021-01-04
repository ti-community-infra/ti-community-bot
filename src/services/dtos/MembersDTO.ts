export interface MembersDTO {
  members: MemberDTO[];
  total: number;
}

interface MemberDTO {
  githubName: string;
  level: string;
  sigName?: string;
}
