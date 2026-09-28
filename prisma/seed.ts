import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { customAlphabet } from 'nanoid';

// Strategy: clear and reseed in a transaction. Every run is repeatable and
// cannot leave duplicate rows behind.
const prisma = new PrismaClient();
const makeId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);
const subjects = [
  ['Calculus II', 'Math'], ['Linear Algebra', 'Math'], ['Organic Chemistry', 'Science'], ['Physics Mechanics', 'Science'],
  ['Spanish Conversation', 'Languages'], ['French Literature', 'Languages'], ['World History', 'Humanities'], ['Introduction to Psychology', 'Humanities'],
  ['Data Structures', 'Computer Science'], ['Web Development', 'Computer Science'], ['Statistics', 'Math'], ['Cell Biology', 'Science'],
  ['Academic Writing', 'Humanities'], ['Japanese Language', 'Languages'], ['Database Systems', 'Computer Science'],
] as const;
const unique = <T>(items: T[], count: number) => faker.helpers.arrayElements(items, count);

async function main() {
  faker.seed(20260928);
  await prisma.$transaction(async (tx) => {
    await tx.booking.deleteMany(); await tx.session.deleteMany(); await tx.studyGroupMember.deleteMany();
    await tx.studyGroup.deleteMany(); await tx.studentSubject.deleteMany(); await tx.student.deleteMany(); await tx.subject.deleteMany();
    const subjectRows = await Promise.all(subjects.map(([name, category]) => tx.subject.create({ data: { id: makeId(), name, category } })));
    const students = [];
    for (let i = 0; i < 300; i++) {
      const isTutor = faker.number.float({ min: 0, max: 1 }) < 0.3;
      students.push(await tx.student.create({ data: { id: makeId(), name: faker.person.fullName(), email: `student${String(i + 1).padStart(3, '0')}@peerup.example`, bio: faker.datatype.boolean({ probability: 0.7 }) ? faker.lorem.sentence() : null, isTutor } }));
    }
    const links: { studentId: string; subjectId: string; role: string }[] = [];
    for (const student of students) for (const subject of unique(subjectRows, faker.number.int({ min: 1, max: 3 }))) links.push({ studentId: student.id, subjectId: subject.id, role: student.isTutor && faker.datatype.boolean({ probability: 0.55 }) ? 'tutor' : 'learner' });
    await tx.studentSubject.createMany({ data: links.map((link) => ({ ...link, id: makeId() })) });
    const groups = [];
    for (let i = 0; i < 60; i++) {
      const subject = subjectRows[i % subjectRows.length];
      groups.push(await tx.studyGroup.create({ data: { id: makeId(), name: `${subject.name} ${faker.helpers.arrayElement(['Study Circle', 'Exam Prep', 'Problem Solving Lab', 'Peer Workshop'])}`, description: `A peer-led group for ${subject.name.toLowerCase()}.`, subjectId: subject.id, maxMembers: faker.number.int({ min: 4, max: 12 }) } }));
    }
    for (const group of groups) {
      const eligible = students.filter((s) => links.some((link) => link.studentId === s.id && link.subjectId === group.subjectId));
      await tx.studyGroupMember.createMany({ data: unique(eligible, Math.min(group.maxMembers, eligible.length)).map((student) => ({ id: makeId(), studyGroupId: group.id, studentId: student.id })) });
    }
    const now = new Date(); const sessions = [];
    for (let i = 0; i < 400; i++) {
      const group = groups[i % groups.length]; const start = new Date(now.getTime() + faker.number.int({ min: -120, max: 120 }) * 86400000); start.setMinutes(0, 0, 0);
      sessions.push(await tx.session.create({ data: { id: makeId(), studyGroupId: group.id, startTime: start, endTime: new Date(start.getTime() + 5400000), locationOrLink: faker.helpers.arrayElement(['Library Room 204', 'Student Center Room 3', 'https://meet.peerup.example/study-room', 'Science Building Lab 1']), status: start < now ? 'completed' : (faker.number.int({ min: 1, max: 20 }) === 1 ? 'cancelled' : 'scheduled') } }));
    }
    const bookings: { id: string; studentId: string; sessionId: string; status: string }[] = []; const used = new Set<string>();
    for (const session of sessions.filter((s) => s.status === 'scheduled')) {
      if (bookings.length >= 500) break;
      const cap = groups.find((group) => group.id === session.studyGroupId)!.maxMembers;
      for (const student of faker.helpers.shuffle(students)) {
        if (bookings.filter((b) => b.sessionId === session.id && b.status === 'confirmed').length >= cap) break;
        const key = `${student.id}:${session.id}`; if (used.has(key)) continue; used.add(key); bookings.push({ id: makeId(), studentId: student.id, sessionId: session.id, status: 'confirmed' });
      }
    }
    for (const booking of faker.helpers.arrayElements(bookings, Math.min(20, bookings.length))) booking.status = 'cancelled';
    await tx.booking.createMany({ data: bookings });
    console.log(`Seeded ${subjectRows.length} subjects, ${students.length} students, ${links.length} student-subject links, ${groups.length} groups, ${sessions.length} sessions, ${bookings.length} bookings.`);
  }, { timeout: 120000 });
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
