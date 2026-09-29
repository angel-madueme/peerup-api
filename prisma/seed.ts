import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { customAlphabet } from 'nanoid';

// Strategy: build every row in memory, clear existing data in reverse dependency
// order, then batch-insert each table in one transaction so every run is repeatable
// and a failure leaves the database unchanged.
const prisma = new PrismaClient();
const makeId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);

const subjectDefinitions = [
  ['Calculus II', 'Math'],
  ['Linear Algebra', 'Math'],
  ['Organic Chemistry', 'Science'],
  ['Physics Mechanics', 'Science'],
  ['Spanish Conversation', 'Languages'],
  ['French Literature', 'Languages'],
  ['World History', 'Humanities'],
  ['Introduction to Psychology', 'Humanities'],
  ['Data Structures', 'Computer Science'],
  ['Web Development', 'Computer Science'],
  ['Statistics', 'Math'],
  ['Cell Biology', 'Science'],
  ['Academic Writing', 'Humanities'],
  ['Japanese Language', 'Languages'],
  ['Database Systems', 'Computer Science'],
] as const;

const pickUnique = <T>(items: T[], count: number) => faker.helpers.arrayElements(items, count);

async function main() {
  faker.seed(20260928);

  const subjectRows = subjectDefinitions.map(([name, category]) => ({
    id: makeId(),
    name,
    category,
  }));

  const studentRows = Array.from({ length: 300 }, (_, index) => ({
    id: makeId(),
    name: faker.person.fullName(),
    email: `student${String(index + 1).padStart(3, '0')}@peerup.example`,
    bio: faker.datatype.boolean({ probability: 0.7 }) ? faker.lorem.sentence() : null,
    isTutor: faker.number.float({ min: 0, max: 1 }) < 0.3,
  }));

  const studentSubjectRows: Array<{ id: string; studentId: string; subjectId: string; role: string }> = [];
  const studentsBySubject = new Map<string, string[]>();

  for (const student of studentRows) {
    for (const subject of pickUnique(subjectRows, faker.number.int({ min: 1, max: 3 }))) {
      studentSubjectRows.push({
        id: makeId(),
        studentId: student.id,
        subjectId: subject.id,
        role: student.isTutor && faker.datatype.boolean({ probability: 0.55 }) ? 'tutor' : 'learner',
      });

      const subjectStudents = studentsBySubject.get(subject.id) ?? [];
      subjectStudents.push(student.id);
      studentsBySubject.set(subject.id, subjectStudents);
    }
  }

  const studyGroupRows = Array.from({ length: 60 }, (_, index) => {
    const subject = subjectRows[index % subjectRows.length];
    return {
      id: makeId(),
      name: `${subject.name} ${faker.helpers.arrayElement(['Study Circle', 'Exam Prep', 'Problem Solving Lab', 'Peer Workshop'])}`,
      description: `A peer-led group for ${subject.name.toLowerCase()}.`,
      subjectId: subject.id,
      maxMembers: faker.number.int({ min: 4, max: 12 }),
    };
  });

  const studyGroupMemberRows = studyGroupRows.flatMap((group, index) => {
    const eligibleStudentIds = studentsBySubject.get(group.subjectId) ?? [];
    const isFull = index % 4 === 0;
    const targetCount = isFull
      ? group.maxMembers
      : Math.max(1, Math.round(group.maxMembers * (0.4 + (index % 4) * 0.1)));
    const memberCount = Math.min(targetCount, group.maxMembers, eligibleStudentIds.length);

    return pickUnique(eligibleStudentIds, memberCount).map((studentId) => ({
      id: makeId(),
      studyGroupId: group.id,
      studentId,
    }));
  });

  const now = new Date();
  const sessionTimeSlots = [
    { hour: 9, minute: 0 },
    { hour: 11, minute: 0 },
    { hour: 14, minute: 0 },
    { hour: 16, minute: 0 },
    { hour: 18, minute: 0 },
    { hour: 19, minute: 30 },
  ];
  const sessionRows = Array.from({ length: 400 }, (_, index) => {
    const group = studyGroupRows[index % studyGroupRows.length];
    const isPast = index < 120;
    const isCancelled = index >= 395;
    const dayOffset = isPast
      ? index - 120
      : isCancelled
        ? 116 + (index - 395)
        : ((index - 120) % 120) + 1;
    const sessionTime = sessionTimeSlots[index % sessionTimeSlots.length];
    const startTime = new Date(now.getTime() + dayOffset * 86400000);
    startTime.setHours(sessionTime.hour, sessionTime.minute, 0, 0);

    return {
      id: makeId(),
      studyGroupId: group.id,
      startTime,
      endTime: new Date(startTime.getTime() + 5400000),
      locationOrLink: faker.helpers.arrayElement([
        'Library Room 204',
        'Student Center Room 3',
        'https://meet.peerup.example/study-room',
        'Science Building Lab 1',
      ]),
      status: isPast ? 'completed' : isCancelled ? 'cancelled' : 'scheduled',
    };
  });

  const groupsById = new Map(studyGroupRows.map((group) => [group.id, group]));
  const bookingRows: Array<{ id: string; studentId: string; sessionId: string; status: string }> = [];

  for (const session of sessionRows.filter((candidate) => candidate.status === 'scheduled')) {
    if (bookingRows.length >= 500) break;

    const group = groupsById.get(session.studyGroupId)!;
    const remaining = 500 - bookingRows.length;
    for (const student of pickUnique(studentRows, Math.min(group.maxMembers, remaining))) {
      bookingRows.push({
        id: makeId(),
        studentId: student.id,
        sessionId: session.id,
        status: 'confirmed',
      });
    }
  }

  for (const booking of bookingRows.slice(0, Math.min(20, bookingRows.length))) {
    booking.status = 'cancelled';
  }

  const counts = await prisma.$transaction(async (tx) => {
    await tx.booking.deleteMany();
    await tx.session.deleteMany();
    await tx.studyGroupMember.deleteMany();
    await tx.studyGroup.deleteMany();
    await tx.studentSubject.deleteMany();
    await tx.student.deleteMany();
    await tx.subject.deleteMany();

    await tx.subject.createMany({ data: subjectRows });
    await tx.student.createMany({ data: studentRows });
    await tx.studentSubject.createMany({ data: studentSubjectRows });
    await tx.studyGroup.createMany({ data: studyGroupRows });
    await tx.studyGroupMember.createMany({ data: studyGroupMemberRows });
    await tx.session.createMany({ data: sessionRows });
    await tx.booking.createMany({ data: bookingRows });

    return {
      subjects: await tx.subject.count(),
      students: await tx.student.count(),
      studentSubjects: await tx.studentSubject.count(),
      studyGroups: await tx.studyGroup.count(),
      studyGroupMembers: await tx.studyGroupMember.count(),
      sessions: await tx.session.count(),
      bookings: await tx.booking.count(),
    };
  }, { timeout: 60000 });

  console.log(`Subjects: ${counts.subjects}`);
  console.log(`Students: ${counts.students}`);
  console.log(`StudentSubject: ${counts.studentSubjects}`);
  console.log(`StudyGroups: ${counts.studyGroups}`);
  console.log(`StudyGroupMember: ${counts.studyGroupMembers}`);
  console.log(`Sessions: ${counts.sessions}`);
  console.log(`Bookings: ${counts.bookings}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
