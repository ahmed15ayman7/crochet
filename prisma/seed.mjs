import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.course.count();
  if (existing > 0) return;

  await prisma.course.create({
    data: {
      title: "Sample course",
      videoUrl: "https://example.com/sample-video.mp4",
      detailedDescription:
        "This is placeholder course content. Replace with your real video URL and description.",
      additionalNotes: "Optional notes for learners.",
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
