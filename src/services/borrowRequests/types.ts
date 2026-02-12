import type { ServiceMode, OnlineChannel } from "@prisma/client";

export type BorrowRequestDetailJson = {
  serviceMode?: ServiceMode; // ONLINE | ONSITE
  requiredTopics?: string[];
  onlineChannel?: OnlineChannel | string | null;
  onsiteLocationText?: string | null;
  notes?: string | null;
};

export type RankedConsultant = {
  consultantId: number;
  consultantUniversityId: number;
  consultantName: string;
  matchedTopics: string[];
  shifts: Array<{
    borrowOnCallShiftId: number;
    startAt: string;
    endAt: string;
    status: string;
  }>;
};

export type RankedUniversity = {
  universityId: number;
  universityCode: string;
  universityNameTh: string;
  distanceKm: number | null;
  matchScore: number;
  reasons: string[];
  availableConsultants: RankedConsultant[];
};

export type PlatformBorrowRequestDetail = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request: any; // prisma object
  parsedDetail: BorrowRequestDetailJson;
  rankedUniversities: RankedUniversity[];
};
