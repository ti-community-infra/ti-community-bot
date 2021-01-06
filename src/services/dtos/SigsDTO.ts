export interface SigsDTO {
  sigs: SigDTO[];
  total: number;
}

interface SigDTO {
  id: number;
  name: string;
  info: string;
  sigUrl: string;
  channel: string;
  membersCount: number;
  needsLGTM: number;
}
