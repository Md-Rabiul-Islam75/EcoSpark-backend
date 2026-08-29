require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

const categories = [
  { name: 'Energy', description: 'Energy efficiency and renewable power ideas' },
  { name: 'Waste', description: 'Waste reduction and circular economy ideas' },
  { name: 'Transportation', description: 'Low-carbon transport and mobility ideas' },
  { name: 'Agriculture', description: 'Climate-smart agriculture ideas' },
  { name: 'Water', description: 'Water conservation and resilience ideas' },
  { name: 'Climate', description: 'General climate action ideas' },
  { name: 'Recycling', description: 'Recycling and reuse ideas' },
  { name: 'Green Buildings', description: 'Efficient buildings and sustainable design' },
];

const createSlug = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: createSlug(category.name) },
      update: { description: category.description },
      create: {
        name: category.name,
        slug: createSlug(category.name),
        description: category.description,
      },
    });
  }

  console.log(`Seeded ${categories.length} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
