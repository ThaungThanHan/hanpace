import { mockMemberClassHistoriesByMember, mockMembers } from "./data";
import type { IMembersRepository } from "./interface";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const membersRepository: IMembersRepository = {
  async getMembers() {
    await delay(700);
    return mockMembers.map((member) => ({
      ...member,
      classHistory: mockMemberClassHistoriesByMember[member.id] ?? [],
    }));
  },
};
