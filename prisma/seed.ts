import "dotenv/config";
import {
  Prisma,
  audio_source_type,
  publish_status,
  question_type,
  speaking_part_type,
  speaking_prompt_type,
  test_section_type,
  test_type,
  user_role,
  user_status,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/config/prisma";


async function upsertUser(params: {
  email: string;
  fullName: string;
  role: user_role;
  status?: user_status;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(params.password, 10);

  return prisma.users.upsert({
    where: { email: params.email },
    update: {
      full_name: params.fullName,
      password_hash: passwordHash,
      role: params.role,
      status: params.status ?? user_status.ACTIVE,
      updated_at: new Date(),
    },
    create: {
      full_name: params.fullName,
      email: params.email,
      password_hash: passwordHash,
      role: params.role,
      status: params.status ?? user_status.ACTIVE,
    },
  });
}

async function main() {
  const admin = await upsertUser({
    email: "admin@ielts.local",
    fullName: "System Admin",
    role: user_role.ADMIN,
    password: "Admin@123",
  });

  const teacher = await upsertUser({
    email: "teacher@ielts.local",
    fullName: "IELTS Teacher",
    role: user_role.TEACHER,
    password: "Teacher@123",
  });

  const user = await upsertUser({
    email: "user@ielts.local",
    fullName: "IELTS Student",
    role: user_role.USER,
    password: "User@123",
  });

  const tagData = [
    { name: "Cambridge", slug: "cambridge" },
    { name: "Band 6.5", slug: "band-6-5" },
    { name: "Band 7.0", slug: "band-7-0" },
    { name: "Education", slug: "education" },
    { name: "Environment", slug: "environment" },
    { name: "Technology", slug: "technology" },
  ];

  const tags: Array<{ id: string; name: string; slug: string }> = [];

  for (const tag of tagData) {
    const item = await prisma.tags.upsert({
      where: { slug: tag.slug },
      update: {
        name: tag.name,
        updated_at: new Date(),
      },
      create: tag,
    });

    tags.push(item);
  }

  const tagMap = new Map<string, string>(tags.map((tag) => [tag.slug, tag.id]));

  const systemConfigs = [
    ["readingDefaultSec", 3600],
    ["listeningDefaultSec", 1800],
    ["writingDefaultSec", 3600],
    ["speakingDefaultSec", 900],
    ["fullTestDefaultSec", 9900],
    ["readingCustomMinSec", 600],
    ["readingCustomMaxSec", 5400],
    ["listeningCustomMinSec", 600],
    ["listeningCustomMaxSec", 3600],
    ["writingCustomMinSec", 600],
    ["writingCustomMaxSec", 5400],
    ["speakingCustomMinSec", 300],
    ["speakingCustomMaxSec", 1800],
    ["fullTestCustomMinSec", 1800],
    ["fullTestCustomMaxSec", 14400],
  ] as const;

  for (const [key, value] of systemConfigs) {
    await prisma.system_configs.upsert({
      where: { key },
      update: {
        value_json: value as Prisma.InputJsonValue,
        updated_by: admin.id,
        updated_at: new Date(),
      },
      create: {
        key,
        value_json: value as Prisma.InputJsonValue,
        updated_by: admin.id,
      },
    });
  }

  await prisma.reading_sets.upsert({
    where: { id: "READ_001" },
    update: {
      title: "The History of Glass",
      passage_text:
        "Glass has been used for centuries in architecture and manufacturing...",
      level: 6.5,
      status: publish_status.PUBLISHED,
      updated_at: new Date(),
    },
    create: {
      id: "READ_001",
      title: "The History of Glass",
      passage_text:
        "Glass has been used for centuries in architecture and manufacturing...",
      level: 6.5,
      status: publish_status.PUBLISHED,
      created_by: admin.id,
    },
  });

  await prisma.reading_set_tags.deleteMany({
    where: { reading_set_id: "READ_001" },
  });

  await prisma.reading_set_tags.createMany({
    data: [tagMap.get("cambridge"), tagMap.get("band-6-5")]
      .filter(Boolean)
      .map((tagId) => ({
        reading_set_id: "READ_001",
        tag_id: tagId!,
      })),
    skipDuplicates: true,
  });

  await prisma.questions.deleteMany({
    where: { reading_set_id: "READ_001" },
  });

  await prisma.questions.createMany({
    data: [
      {
        reading_set_id: "READ_001",
        q_no: 1,
        question_type: question_type.MULTIPLE_CHOICE,
        prompt_text: "What is the main idea of paragraph 1?",
        instruction_text: "Choose the correct answer.",
        options_json: {
          options: ["A", "B", "C", "D"],
        } as Prisma.InputJsonValue,
        correct_answer_json: { value: "A" } as Prisma.InputJsonValue,
        explanation: "Paragraph 1 focuses on the early development of glass.",
        points: 1,
        sort_order: 1,
      },
      {
        reading_set_id: "READ_001",
        q_no: 2,
        question_type: question_type.SHORT_ANSWER,
        prompt_text: "What material was commonly mixed with sand?",
        instruction_text: "Write NO MORE THAN TWO WORDS.",
        options_json: Prisma.DbNull,
        correct_answer_json: { value: "lime" } as Prisma.InputJsonValue,
        explanation: "The passage mentions lime being mixed with sand.",
        points: 1,
        sort_order: 2,
      },
    ],
  });

  await prisma.listening_sets.upsert({
    where: { id: "LIS_001" },
    update: {
      title: "Campus Accommodation",
      transcript_text: "Hello, I am calling about the student accommodation...",
      audio_url: "https://example.com/audio/campus-accommodation.mp3",
      audio_source: audio_source_type.URL,
      level: 6.5,
      status: publish_status.PUBLISHED,
      updated_at: new Date(),
    },
    create: {
      id: "LIS_001",
      title: "Campus Accommodation",
      transcript_text: "Hello, I am calling about the student accommodation...",
      audio_url: "https://example.com/audio/campus-accommodation.mp3",
      audio_source: audio_source_type.URL,
      level: 6.5,
      status: publish_status.PUBLISHED,
      created_by: admin.id,
    },
  });

  await prisma.listening_set_tags.deleteMany({
    where: { listening_set_id: "LIS_001" },
  });

  await prisma.listening_set_tags.createMany({
    data: [tagMap.get("cambridge"), tagMap.get("band-6-5")]
      .filter(Boolean)
      .map((tagId) => ({
        listening_set_id: "LIS_001",
        tag_id: tagId!,
      })),
    skipDuplicates: true,
  });

  await prisma.questions.deleteMany({
    where: { listening_set_id: "LIS_001" },
  });

  await prisma.questions.createMany({
    data: [
      {
        listening_set_id: "LIS_001",
        section_label: "SECTION 1",
        q_no: 1,
        question_type: question_type.FORM_COMPLETION,
        prompt_text: "What is the student name?",
        instruction_text: "Write NO MORE THAN TWO WORDS.",
        options_json: Prisma.DbNull,
        correct_answer_json: { value: "John Smith" } as Prisma.InputJsonValue,
        explanation: "The speaker states the full name clearly.",
        points: 1,
        sort_order: 1,
      },
      {
        listening_set_id: "LIS_001",
        section_label: "SECTION 1",
        q_no: 2,
        question_type: question_type.SHORT_ANSWER,
        prompt_text: "Which building will the student stay in?",
        instruction_text: "Write ONE WORD.",
        options_json: Prisma.DbNull,
        correct_answer_json: { value: "Maple" } as Prisma.InputJsonValue,
        explanation: "The speaker mentions Maple Hall.",
        points: 1,
        sort_order: 2,
      },
    ],
  });

  await prisma.writing_tasks.upsert({
    where: { id: "WT_001" },
    update: {
      task_no: 2,
      title: "University education should be free",
      prompt_text: "To what extent do you agree or disagree?",
      level: 6.5,
      status: publish_status.PUBLISHED,
      updated_at: new Date(),
    },
    create: {
      id: "WT_001",
      task_no: 2,
      title: "University education should be free",
      prompt_text: "To what extent do you agree or disagree?",
      level: 6.5,
      status: publish_status.PUBLISHED,
      created_by: admin.id,
    },
  });

  await prisma.writing_task_tags.deleteMany({
    where: { writing_task_id: "WT_001" },
  });

  await prisma.writing_task_tags.createMany({
    data: [tagMap.get("education"), tagMap.get("band-6-5")]
      .filter(Boolean)
      .map((tagId) => ({
        writing_task_id: "WT_001",
        tag_id: tagId!,
      })),
    skipDuplicates: true,
  });

  await prisma.speaking_sets.upsert({
    where: { id: "SPK_001" },
    update: {
      topic: "Describe a book",
      level: 6.5,
      status: publish_status.PUBLISHED,
      updated_at: new Date(),
    },
    create: {
      id: "SPK_001",
      topic: "Describe a book",
      level: 6.5,
      status: publish_status.PUBLISHED,
      created_by: admin.id,
    },
  });

  await prisma.speaking_set_tags.deleteMany({
    where: { speaking_set_id: "SPK_001" },
  });

  await prisma.speaking_set_tags.createMany({
    data: [tagMap.get("education"), tagMap.get("band-6-5")]
      .filter(Boolean)
      .map((tagId) => ({
        speaking_set_id: "SPK_001",
        tag_id: tagId!,
      })),
    skipDuplicates: true,
  });

  await prisma.speaking_parts.deleteMany({
    where: { speaking_set_id: "SPK_001" },
  });

  const part1 = await prisma.speaking_parts.create({
    data: {
      speaking_set_id: "SPK_001",
      part_type: speaking_part_type.PART_1,
      title: "Introduction",
      instructions: "Answer the following questions.",
      recommended_sec: 240,
      sort_order: 1,
    },
  });

  const part2 = await prisma.speaking_parts.create({
    data: {
      speaking_set_id: "SPK_001",
      part_type: speaking_part_type.PART_2,
      title: "Cue card",
      instructions: "You should speak for 1-2 minutes.",
      recommended_sec: 120,
      sort_order: 2,
    },
  });

  const part3 = await prisma.speaking_parts.create({
    data: {
      speaking_set_id: "SPK_001",
      part_type: speaking_part_type.PART_3,
      title: "Discussion",
      instructions: "Discuss the following topic in depth.",
      recommended_sec: 240,
      sort_order: 3,
    },
  });

  await prisma.speaking_prompts.create({
    data: {
      speaking_part_id: part1.id,
      prompt_type: speaking_prompt_type.QUESTION,
      content: "Do you enjoy reading books?",
      time_suggest_sec: 30,
      sort_order: 1,
    },
  });

  const prompt2 = await prisma.speaking_prompts.create({
    data: {
      speaking_part_id: part2.id,
      prompt_type: speaking_prompt_type.CUE_CARD,
      content: "Describe a book you recently read.",
      time_suggest_sec: 120,
      sort_order: 1,
    },
  });

  await prisma.speaking_prompt_items.createMany({
    data: [
      {
        speaking_prompt_id: prompt2.id,
        item_text: "what the book is",
        sort_order: 1,
      },
      {
        speaking_prompt_id: prompt2.id,
        item_text: "when you read it",
        sort_order: 2,
      },
      {
        speaking_prompt_id: prompt2.id,
        item_text: "why you liked it",
        sort_order: 3,
      },
    ],
  });

  await prisma.speaking_prompts.create({
    data: {
      speaking_part_id: part3.id,
      prompt_type: speaking_prompt_type.FOLLOW_UP,
      content: "Why do some people prefer reading physical books?",
      time_suggest_sec: 60,
      sort_order: 1,
    },
  });

  await prisma.tests.upsert({
    where: { id: "TEST_001" },
    update: {
      type: test_type.FULL,
      title: "Cambridge Style Full Test 01",
      level: 6.5,
      description: "Full test for demo and development.",
      status: publish_status.PUBLISHED,
      published_at: new Date(),
      updated_at: new Date(),
    },
    create: {
      id: "TEST_001",
      type: test_type.FULL,
      title: "Cambridge Style Full Test 01",
      level: 6.5,
      description: "Full test for demo and development.",
      status: publish_status.PUBLISHED,
      published_at: new Date(),
      created_by: admin.id,
    },
  });

  await prisma.test_tags.deleteMany({
    where: { test_id: "TEST_001" },
  });

  await prisma.test_tags.createMany({
    data: [tagMap.get("cambridge"), tagMap.get("band-6-5")]
      .filter(Boolean)
      .map((tagId) => ({
        test_id: "TEST_001",
        tag_id: tagId!,
      })),
    skipDuplicates: true,
  });

  await prisma.test_sections.deleteMany({
    where: { test_id: "TEST_001" },
  });

  await prisma.test_sections.createMany({
    data: [
      {
        test_id: "TEST_001",
        section_type: test_section_type.READING_SET,
        reading_set_id: "READ_001",
        part_label: "READING",
        sort_order: 1,
        time_limit_sec: 3600,
      },
      {
        test_id: "TEST_001",
        section_type: test_section_type.LISTENING_SET,
        listening_set_id: "LIS_001",
        part_label: "LISTENING",
        sort_order: 2,
        time_limit_sec: 1800,
      },
      {
        test_id: "TEST_001",
        section_type: test_section_type.WRITING_TASK,
        writing_task_id: "WT_001",
        part_label: "WRITING",
        sort_order: 3,
        time_limit_sec: 3600,
      },
      {
        test_id: "TEST_001",
        section_type: test_section_type.SPEAKING_SET,
        speaking_set_id: "SPK_001",
        part_label: "SPEAKING",
        sort_order: 4,
        time_limit_sec: 900,
      },
    ],
  });

  await prisma.blogs.upsert({
    where: { slug: "how-to-improve-ielts-writing-task-2" },
    update: {
      title: "How to improve IELTS Writing Task 2",
      excerpt: "A practical guide to improve task response and coherence.",
      content_markdown:
        "# IELTS Writing Task 2\n\nFocus on clarity, structure, and examples.",
      cover_image_url: null,
      status: "PUBLISHED",
      published_at: new Date(),
      updated_at: new Date(),
    },
    create: {
      title: "How to improve IELTS Writing Task 2",
      slug: "how-to-improve-ielts-writing-task-2",
      excerpt: "A practical guide to improve task response and coherence.",
      content_markdown:
        "# IELTS Writing Task 2\n\nFocus on clarity, structure, and examples.",
      cover_image_url: null,
      status: "PUBLISHED",
      published_at: new Date(),
      created_by: admin.id,
    },
  });

  console.log("Seed completed");
  console.log({
    admin: admin.email,
    teacher: teacher.email,
    user: user.email,
    sampleTestId: "TEST_001",
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
