import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashPassword } from '../src/utils/password';
import { createSlug } from '../src/utils/slug';
import { env } from '../src/config/env';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.databaseUrl,
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

const sampleIdeas = [
  {
    title: 'Community Solar Initiative',
    problemStatement: 'High electricity costs and carbon footprint in urban areas',
    proposedSolution: 'Implement shared solar panels on community buildings',
    description: 'A detailed plan to install solar panels on apartment rooftops and commercial buildings, with transparent benefit-sharing system.',
    category: 'Energy',
    isPaid: false,
    price: null,
    images: ['https://via.placeholder.com/600x400?text=Solar+Initiative'],
  },
  {
    title: 'Plastic-Free Packaging System',
    problemStatement: 'Excessive plastic packaging waste from local retailers',
    proposedSolution: 'Implement reusable, biodegradable packaging alternatives',
    description: 'A comprehensive system to replace single-use plastic with compostable packaging. Includes customer incentives.',
    category: 'Waste',
    isPaid: false,
    price: null,
    images: ['https://via.placeholder.com/600x400?text=Plastic+Free'],
  },
  {
    title: 'Electric Bike Sharing Network',
    problemStatement: 'Traffic congestion and air pollution in city centers',
    proposedSolution: 'Deploy electric bike stations across the city',
    description: 'Premium e-bike sharing solution with charging stations. Reduces traffic and promotes healthy, sustainable transportation.',
    category: 'Transportation',
    isPaid: true,
    price: 4.99,
    images: ['https://via.placeholder.com/600x400?text=E-Bike'],
  },
];

async function main() {
  console.log('🌱 Starting database seeding...');

  const adminPassword = await hashPassword('Admin@12345');
  const memberPassword = await hashPassword('Member@12345');

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ecosparkhub.com' },
    update: {},
    create: {
      name: 'EcoSpark Admin',
      email: 'admin@ecosparkhub.com',
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
      bio: 'EcoSpark Platform Administrator',
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create Sample Members
  const member1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      password: memberPassword,
      role: Role.MEMBER,
      isActive: true,
      bio: 'Environmental enthusiast',
    },
  });

  const member2 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      name: 'Sarah Smith',
      email: 'sarah@example.com',
      password: memberPassword,
      role: Role.MEMBER,
      isActive: true,
      bio: 'Green technology innovator',
    },
  });
  console.log(`✅ Members created: ${member1.email}, ${member2.email}`);

  // Create Categories
  const createdCategories = [];
  for (const category of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: createSlug(category.name) },
      update: { description: category.description },
      create: {
        name: category.name,
        slug: createSlug(category.name),
        description: category.description,
      },
    });
    createdCategories.push(cat);
  }
  console.log(`✅ ${categories.length} categories created`);

  // Create Sample Ideas
  for (let i = 0; i < sampleIdeas.length; i++) {
    const idea = sampleIdeas[i];
    const category = createdCategories.find(c => c.name === idea.category);
    
    await prisma.idea.upsert({
      where: { slug: createSlug(idea.title) },
      update: {},
      create: {
        title: idea.title,
        slug: createSlug(idea.title),
        problemStatement: idea.problemStatement,
        proposedSolution: idea.proposedSolution,
        description: idea.description,
        images: idea.images,
        status: 'APPROVED',
        isPublished: true,
        isFeatured: true,
        isPaid: idea.isPaid,
        price: idea.price ? idea.price.toString() : null,
        authorId: i % 2 === 0 ? member1.id : member2.id,
        categoryId: category!.id,
      },
    });
  }
  console.log(`✅ ${sampleIdeas.length} sample ideas created`);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
