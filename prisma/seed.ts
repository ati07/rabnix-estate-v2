import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Base accounts so you can log in and start curating immediately after deploy.
// No demo listings/builders/projects/agents/collections are seeded — the site
// shows "Space available" placeholders until real inventory is added.
const DEMO_ACCOUNTS = [
  { key: 'admin',   name: 'BayBayt Master Admin', email: 'admin@baybayt.com', phone: '+91 80000 99099', role: 'admin',   password: 'admin123',    city: 'National (HQ)', companyName: 'BayBayt Verification Division' },
  { key: 'owner',   name: 'Priya Venkatesh',     email: 'owner@baybayt.com',       phone: '+91 98450 11223', role: 'owner',   password: 'password123', city: 'Bangalore' },
  { key: 'buyer',   name: 'Rahul Sharma',        email: 'buyer@baybayt.com',       phone: '+91 98765 43210', role: 'buyer',   password: 'password123', city: 'Bangalore' },
  { key: 'agent',   name: 'Vikram Deshmukh',     email: 'agent@baybayt.com',       phone: '+91 98200 99887', role: 'agent',   password: 'password123', city: 'Mumbai',    companyName: 'Prestige Realty Advisors', reraNumber: 'PRM/KA/RERA/1251/310/AG/210412/00189' },
  { key: 'builder', name: 'Amit Singhal',        email: 'builder@baybayt.com',     phone: '+91 99110 55443', role: 'builder', password: 'password123', city: 'Delhi / NCR', companyName: 'Godrej Properties Ltd', reraNumber: 'DLRERA2019P0004' },
] as const;

async function main() {
  console.log('Seeding database...');

  // Wipe (safe: dev seed) in FK-safe order.
  await prisma.inquiry.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
  await prisma.builder.deleteMany();
  await prisma.featuredProject.deleteMany();
  await prisma.collection.deleteMany();

  // --- Users (login accounts only) ---
  for (const acc of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.password, 10);
    await prisma.user.create({
      data: {
        name: acc.name,
        email: acc.email,
        phone: acc.phone,
        passwordHash,
        role: acc.role,
        city: acc.city,
        companyName: 'companyName' in acc ? acc.companyName : undefined,
        reraNumber: 'reraNumber' in acc ? acc.reraNumber : undefined,
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    });
  }
  console.log(`Created ${DEMO_ACCOUNTS.length} login accounts.`);

  console.log('Seed complete (accounts only — no demo inventory).');
  console.log('\nLogin credentials:');
  console.table(DEMO_ACCOUNTS.map((a) => ({ role: a.role, email: a.email, password: a.password })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
