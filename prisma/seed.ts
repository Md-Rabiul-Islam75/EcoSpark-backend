import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import { createSlug } from '../src/utils/slug';

const prisma = new PrismaClient();

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

async function main() {
  const adminPassword = await hashPassword('Admin@12345');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecosparkhub.com' },
    update: {},
    create: {
      name: 'EcoSpark Admin',
      email: 'admin@ecosparkhub.com',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

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

  console.log(`Seeded admin ${admin.email} and ${categories.length} categories.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
