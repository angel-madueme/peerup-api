export const studyGroupInclude = {
  subject: { select: { id: true, name: true, category: true } },
  _count: { select: { members: true } },
  sessions: {
    where: { status: 'scheduled', startTime: { gte: new Date() } },
    select: { id: true, startTime: true, endTime: true, locationOrLink: true },
    orderBy: { startTime: 'asc' as const },
    take: 1,
  },
} as const;

export const toStudyGroup = (group: any) => ({
  id: group.id,
  name: group.name,
  description: group.description,
  maxMembers: group.maxMembers,
  memberCount: group._count.members,
  subject: group.subject,
  nextSession: group.sessions[0] ?? null,
});

export const orderStudyGroups = (groups: any[], sort: 'name' | 'createdAt', order: 'asc' | 'desc') => [...groups].sort((left, right) => {
  const leftValue = left[sort] instanceof Date ? left[sort].getTime() : left[sort];
  const rightValue = right[sort] instanceof Date ? right[sort].getTime() : right[sort];
  if (leftValue < rightValue) return order === 'asc' ? -1 : 1;
  if (leftValue > rightValue) return order === 'asc' ? 1 : -1;
  return left.id.localeCompare(right.id);
});
