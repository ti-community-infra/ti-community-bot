export interface MembersDTO {
  members: MemberDTO[];
}

interface MemberDTO {
  githubName: string;
  level: string;
}
