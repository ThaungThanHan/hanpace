import type { Member, MemberClassHistory } from "../common/schema";

export type MemberWithClassHistory = Member & { classHistory: MemberClassHistory[] };

export interface IMembersRepository {
  getMembers(): Promise<MemberWithClassHistory[]>;
}
