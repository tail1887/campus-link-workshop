import { prisma } from "@/lib/server/prisma";
import type {
  CreateRecruitApplicationInput,
  CreateRecruitPostInput,
  RecruitApplication,
  RecruitPost,
} from "@/types/recruit";

const defaultExpectations = [
  "정해진 기간 동안 꾸준히 참여할 수 있는 분",
  "문서와 커뮤니케이션에 적극적인 분",
  "발표까지 함께 마무리할 수 있는 분",
];

const defaultPerks = ["즉시 시연 가능한 결과물", "협업 데모 경험", "배포 경험"];

function mapPost(record: {
  id: string;
  slug: string;
  title: string;
  category: RecruitPost["category"];
  campus: string;
  summary: string;
  description: string;
  roles: string[];
  techStack: string[];
  capacity: number;
  currentMembers: number;
  stage: string;
  deadline: Date;
  createdAt: Date;
  highlight: boolean;
  ownerId: string | null;
  ownerName: string;
  ownerRole: string;
  meetingStyle: string;
  schedule: string;
  goal: string;
  expectations: string[];
  perks: string[];
}): RecruitPost {
  return {
    ...record,
    deadline: record.deadline.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

function mapApplication(record: {
  id: string;
  post: { slug: string };
  applicantId: string | null;
  name: string;
  contact: string;
  message: string;
  status: RecruitApplication["status"];
  createdAt: Date;
}): RecruitApplication {
  return {
    id: record.id,
    postSlug: record.post.slug,
    applicantId: record.applicantId,
    name: record.name,
    contact: record.contact,
    message: record.message,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function listPrismaPosts() {
  const posts = await prisma.recruitPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return posts.map(mapPost);
}

export async function findPrismaPost(slug: string) {
  const post = await prisma.recruitPost.findUnique({
    where: { slug },
  });

  return post ? mapPost(post) : undefined;
}

export async function createPrismaPost(
  input: CreateRecruitPostInput & { slug: string },
) {
  const post = await prisma.recruitPost.create({
    data: {
      slug: input.slug,
      title: input.title,
      category: input.category,
      campus: input.campus,
      summary: input.summary,
      description: input.description,
      roles: input.roles,
      techStack: input.techStack,
      capacity: input.capacity,
      stage: input.stage,
      deadline: new Date(input.deadline),
      ownerId: input.ownerId ?? null,
      ownerName: input.ownerName,
      ownerRole: input.ownerRole,
      meetingStyle: input.meetingStyle,
      schedule: input.schedule,
      goal: input.goal,
      expectations: defaultExpectations,
      perks: defaultPerks,
    },
  });

  return mapPost(post);
}

export async function hasPrismaDuplicateApplication(
  postSlug: string,
  contact: string,
) {
  const normalizedContact = contact.trim().toLowerCase();
  const duplicate = await prisma.recruitApplication.findFirst({
    where: {
      post: { slug: postSlug },
      contact: normalizedContact,
    },
    select: { id: true },
  });

  return Boolean(duplicate);
}

export async function listPrismaApplicationsByApplicant(applicantId: string) {
  const applications = await prisma.recruitApplication.findMany({
    where: { applicantId },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: { slug: true },
      },
    },
  });

  return applications.map(mapApplication);
}

export async function createPrismaApplication(
  input: CreateRecruitApplicationInput,
) {
  const application = await prisma.recruitApplication.create({
    data: {
      post: {
        connect: { slug: input.postSlug },
      },
      applicantId: input.applicantId ?? null,
      name: input.name.trim(),
      contact: input.contact.trim().toLowerCase(),
      message: input.message.trim(),
    },
    include: {
      post: {
        select: { slug: true },
      },
    },
  });

  return mapApplication(application);
}
