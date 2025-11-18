import { PrismaClient } from "../lib/generated/prisma";
import { Redis } from "@upstash/redis";

const prisma = new PrismaClient();

// Initialize Redis client (optional - for syncing with existing tenants)
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    })
  : null;

/**
 * Multi-Tenant Seed Script for Invoice Management System
 *
 * This script:
 * - Creates multiple tenants (businesses)
 * - Syncs with existing Redis tenants if available
 * - Populates each tenant with isolated data
 * - Demonstrates multi-tenant data isolation
 */

async function main() {
  console.log("🌱 Starting multi-tenant database seed...");

  // Clean existing data (in reverse order of dependencies)
  console.log("🧹 Cleaning existing data...");
  await prisma.payment.deleteMany();
  await prisma.invoiceLineItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("🏢 Creating tenants...");

  // Try to fetch existing tenants from Redis
  let existingTenants: Array<{ subdomain: string; emoji: string }> = [];

  if (redis) {
    try {
      console.log("📡 Checking Redis for existing tenants...");
      const keys = await redis.keys("subdomain:*");
      for (const key of keys) {
        const subdomain = key.replace("subdomain:", "");
        const data = await redis.get(key) as any;
        if (data && subdomain) {
          existingTenants.push({
            subdomain,
            emoji: data.emoji || "🏢",
          });
        }
      }
      console.log(`✅ Found ${existingTenants.length} existing tenants in Redis`);
    } catch (error) {
      console.log("⚠️  Could not fetch from Redis (this is okay):", error);
    }
  }

  // Default tenants if Redis is not available or has no tenants
  const defaultTenants = [
    { subdomain: "acme", emoji: "🚀", name: "Acme Consulting" },
    { subdomain: "techcorp", emoji: "💻", name: "TechCorp Solutions" },
    { subdomain: "buildzco", emoji: "🏗️", name: "BuildZ Construction" },
  ];

  // Create tenants in Prisma
  const tenants = [];

  // Use existing tenants from Redis if available
  if (existingTenants.length > 0) {
    for (const { subdomain, emoji } of existingTenants) {
      const tenant = await prisma.tenant.create({
        data: {
          subdomain,
          name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + " Inc.",
          emoji,
          active: true,
        },
      });
      tenants.push(tenant);
      console.log(`  ✓ Created tenant: ${tenant.name} (${tenant.subdomain})`);
    }
  } else {
    // Create default tenants
    for (const { subdomain, emoji, name } of defaultTenants) {
      const tenant = await prisma.tenant.create({
        data: {
          subdomain,
          name,
          emoji,
          description: `${name} - Professional services company`,
          active: true,
        },
      });
      tenants.push(tenant);
      console.log(`  ✓ Created tenant: ${tenant.name} (${tenant.subdomain})`);

      // Also add to Redis if available
      if (redis) {
        try {
          await redis.set(`subdomain:${subdomain}`, {
            emoji,
            createdAt: Date.now(),
          });
        } catch (error) {
          console.log(`  ⚠️  Could not sync to Redis: ${error}`);
        }
      }
    }
  }

  // Now create data for each tenant
  for (const tenant of tenants) {
    console.log(`\n📊 Seeding data for tenant: ${tenant.name}...`);

    // Create users for this tenant
    const admin = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `admin@${tenant.subdomain}.com`,
        name: "Admin User",
        role: "ADMIN",
        active: true,
      },
    });

    const accountant = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `accountant@${tenant.subdomain}.com`,
        name: "Accountant User",
        role: "ACCOUNTANT",
        active: true,
      },
    });

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `user@${tenant.subdomain}.com`,
        name: "Regular User",
        role: "USER",
        active: true,
      },
    });

    // Create company for this tenant
    const company = await prisma.company.create({
      data: {
        tenantId: tenant.id,
        name: tenant.name,
        email: `contact@${tenant.subdomain}.com`,
        phone: "+1 (555) 100-0000",
        website: `https://${tenant.subdomain}.example.com`,
        address: "123 Business Street",
        city: "San Francisco",
        state: "CA",
        postalCode: "94102",
        country: "USA",
        taxId: "12-3456789",
        taxRate: 8.5,
        primaryColor: "#2563eb",
      },
    });

    // Create clients for this tenant
    const client1 = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        name: "Client Alpha Corp",
        email: `billing@alpha-${tenant.subdomain}.com`,
        phone: "+1 (555) 200-0000",
        address: "456 Client Avenue",
        city: "Austin",
        state: "TX",
        postalCode: "73301",
        country: "USA",
        active: true,
        notes: "VIP client",
      },
    });

    const client2 = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        name: "Client Beta LLC",
        email: `accounts@beta-${tenant.subdomain}.com`,
        phone: "+1 (555) 300-0000",
        address: "789 Customer Drive",
        city: "Seattle",
        state: "WA",
        postalCode: "98101",
        country: "USA",
        active: true,
      },
    });

    // Create projects
    const project1 = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        clientId: client1.id,
        name: "Website Redesign Project",
        description: "Complete website overhaul",
        status: "ACTIVE",
        budget: 50000,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-06-30"),
      },
    });

    const project2 = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        clientId: client2.id,
        name: "Mobile App Development",
        description: "iOS and Android app",
        status: "ACTIVE",
        budget: 80000,
        startDate: new Date("2024-02-01"),
      },
    });

    // Create invoices with line items
    const invoice1 = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        invoiceNumber: `${tenant.subdomain.toUpperCase()}-2024-001`,
        companyId: company.id,
        clientId: client1.id,
        projectId: project1.id,
        userId: admin.id,
        status: "PAID",
        issueDate: new Date("2024-01-20"),
        dueDate: new Date("2024-02-19"),
        paidDate: new Date("2024-02-15"),
        subtotal: 15000,
        taxRate: 8.5,
        taxAmount: 1275,
        discount: 0,
        total: 16275,
        amountPaid: 16275,
        notes: "Phase 1 completed",
        terms: "NET 30",
        lineItems: {
          create: [
            {
              description: "UI/UX Design - 80 hours",
              quantity: 80,
              unitPrice: 125,
              amount: 10000,
              category: "Design",
              order: 1,
            },
            {
              description: "Project Management - 50 hours",
              quantity: 50,
              unitPrice: 100,
              amount: 5000,
              category: "Management",
              order: 2,
            },
          ],
        },
        payments: {
          create: [
            {
              amount: 16275,
              paymentDate: new Date("2024-02-15"),
              paymentMethod: "BANK_TRANSFER",
              reference: "TXN-001",
              notes: "Payment received",
            },
          ],
        },
      },
    });

    const invoice2 = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        invoiceNumber: `${tenant.subdomain.toUpperCase()}-2024-002`,
        companyId: company.id,
        clientId: client2.id,
        projectId: project2.id,
        userId: user.id,
        status: "SENT",
        issueDate: new Date("2024-02-15"),
        dueDate: new Date("2024-03-16"),
        subtotal: 25000,
        taxRate: 8.5,
        taxAmount: 2125,
        discount: 0,
        total: 27125,
        amountPaid: 0,
        notes: "Mobile app phase 1",
        terms: "NET 30",
        lineItems: {
          create: [
            {
              description: "iOS Development - 100 hours",
              quantity: 100,
              unitPrice: 150,
              amount: 15000,
              category: "Development",
              order: 1,
            },
            {
              description: "Android Development - 100 hours",
              quantity: 100,
              unitPrice: 150,
              amount: 15000,
              category: "Development",
              order: 2,
            },
          ],
        },
      },
    });

    const invoice3 = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        invoiceNumber: `${tenant.subdomain.toUpperCase()}-2024-003`,
        companyId: company.id,
        clientId: client1.id,
        userId: admin.id,
        status: "DRAFT",
        issueDate: new Date("2024-03-01"),
        dueDate: new Date("2024-03-31"),
        subtotal: 10000,
        taxRate: 8.5,
        taxAmount: 850,
        discount: 0,
        total: 10850,
        amountPaid: 0,
        notes: "Consulting services",
        terms: "NET 30",
        lineItems: {
          create: [
            {
              description: "Consulting - 100 hours",
              quantity: 100,
              unitPrice: 100,
              amount: 10000,
              category: "Consulting",
              order: 1,
            },
          ],
        },
      },
    });

    // Create expenses
    await prisma.expense.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        projectId: project1.id,
        userId: user.id,
        description: "Software Subscription",
        amount: 99.99,
        category: "SOFTWARE",
        expenseDate: new Date("2024-01-05"),
        status: "APPROVED",
      },
    });

    await prisma.expense.create({
      data: {
        tenantId: tenant.id,
        companyId: company.id,
        userId: admin.id,
        description: "Office Supplies",
        amount: 150.00,
        category: "OFFICE_SUPPLIES",
        expenseDate: new Date("2024-02-10"),
        status: "PENDING",
      },
    });

    console.log(`  ✓ Created ${tenant.name} data: 3 users, 1 company, 2 clients, 2 projects, 3 invoices, 2 expenses`);
  }

  console.log("\n✅ Multi-tenant database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`  - Tenants: ${tenants.length}`);
  console.log(`  - Each tenant has:`);
  console.log(`    • 3 Users (Admin, Accountant, User)`);
  console.log(`    • 1 Company`);
  console.log(`    • 2 Clients`);
  console.log(`    • 2 Projects`);
  console.log(`    • 3 Invoices (1 PAID, 1 SENT, 1 DRAFT)`);
  console.log(`    • 2 Expenses`);
  console.log("\n🎓 Next steps:");
  console.log("   - Run: npx prisma studio");
  console.log("   - Visit: http://localhost:3000/invoices");
  console.log("   - Visit tenant subdomains:");
  tenants.forEach((t) =>
    console.log(`     • http://${t.subdomain}.localhost:3000/invoices`)
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error seeding database:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
