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
