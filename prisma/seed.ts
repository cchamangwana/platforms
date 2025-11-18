import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

/**
 * Seed Script for Invoice Management System
 *
 * This script populates the database with realistic sample data
 * to help you learn Prisma concepts:
 * - Creating records
 * - Handling relations
 * - Working with enums
 * - Managing dates and numbers
 */

async function main() {
  console.log("🌱 Starting database seed...");

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

  console.log("👤 Creating users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@acmeconsulting.com",
      name: "Alice Johnson",
      role: "ADMIN",
      active: true,
    },
  });

  const accountant = await prisma.user.create({
    data: {
      email: "accountant@acmeconsulting.com",
      name: "Bob Smith",
      role: "ACCOUNTANT",
      active: true,
    },
  });

  const user = await prisma.user.create({
    data: {
      email: "sarah@acmeconsulting.com",
      name: "Sarah Davis",
      role: "USER",
      active: true,
    },
  });

  console.log("🏢 Creating company...");
  const company = await prisma.company.create({
    data: {
      name: "Acme Consulting Inc.",
      email: "contact@acmeconsulting.com",
      phone: "+1 (555) 123-4567",
      website: "https://acmeconsulting.com",
      address: "123 Business Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      country: "USA",
      taxId: "12-3456789",
      taxRate: 8.5, // 8.5% tax rate
      primaryColor: "#2563eb",
    },
  });

  console.log("🤝 Creating clients...");
  const techCorp = await prisma.client.create({
    data: {
      companyId: company.id,
      name: "TechCorp Solutions",
      email: "billing@techcorp.com",
      phone: "+1 (555) 234-5678",
      website: "https://techcorp.com",
      address: "456 Tech Avenue",
      city: "Austin",
      state: "TX",
      postalCode: "73301",
      country: "USA",
      taxId: "98-7654321",
      active: true,
      notes: "Major client - NET 30 terms",
    },
  });

  const innovateInc = await prisma.client.create({
    data: {
      companyId: company.id,
      name: "Innovate Inc.",
      email: "accounts@innovate.com",
      phone: "+1 (555) 345-6789",
      address: "789 Innovation Drive",
      city: "Seattle",
      state: "WA",
      postalCode: "98101",
      country: "USA",
      active: true,
    },
  });

  const buildersLLC = await prisma.client.create({
    data: {
      companyId: company.id,
      name: "Builders LLC",
      email: "finance@buildersllc.com",
      phone: "+1 (555) 456-7890",
      address: "321 Construction Blvd",
      city: "Denver",
      state: "CO",
      postalCode: "80202",
      country: "USA",
      active: true,
      notes: "Construction industry client",
    },
  });

  console.log("📁 Creating projects...");
  const websiteProject = await prisma.project.create({
    data: {
      companyId: company.id,
      clientId: techCorp.id,
      name: "Website Redesign",
      description: "Complete overhaul of company website with modern design",
      status: "ACTIVE",
      budget: 50000,
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-06-30"),
    },
  });

  const appProject = await prisma.project.create({
    data: {
      companyId: company.id,
      clientId: innovateInc.id,
      name: "Mobile App Development",
      description: "iOS and Android mobile application",
      status: "ACTIVE",
      budget: 120000,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2024-12-31"),
    },
  });

  const consultingProject = await prisma.project.create({
    data: {
      companyId: company.id,
      clientId: buildersLLC.id,
      name: "Digital Transformation Consulting",
      description: "Strategic consulting for digital transformation",
      status: "COMPLETED",
      budget: 75000,
      startDate: new Date("2023-09-01"),
      endDate: new Date("2024-03-31"),
    },
  });

  console.log("💰 Creating invoices with line items...");

  // Invoice 1 - PAID
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2024-001",
      companyId: company.id,
      clientId: techCorp.id,
      projectId: websiteProject.id,
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
      notes: "Phase 1 - Design and planning",
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
            reference: "TXN-987654321",
            notes: "Payment received in full",
          },
        ],
      },
    },
  });

  // Invoice 2 - PARTIAL payment
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2024-002",
      companyId: company.id,
      clientId: innovateInc.id,
      projectId: appProject.id,
      userId: user.id,
      status: "PARTIAL",
      issueDate: new Date("2024-02-15"),
      dueDate: new Date("2024-03-16"),
      subtotal: 40000,
      taxRate: 8.5,
      taxAmount: 3400,
      discount: 2000, // $2000 discount
      total: 41400,
      amountPaid: 20000,
      notes: "Mobile app development - Phase 1",
      terms: "50% upfront, 50% on completion",
      lineItems: {
        create: [
          {
            description: "iOS Development - 200 hours",
            quantity: 200,
            unitPrice: 150,
            amount: 30000,
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
          {
            description: "Backend API Integration",
            quantity: 1,
            unitPrice: -5000, // Discount
            amount: -5000,
            category: "Discount",
            order: 3,
          },
        ],
      },
      payments: {
        create: [
          {
            amount: 20000,
            paymentDate: new Date("2024-02-20"),
            paymentMethod: "STRIPE",
            reference: "pi_3abc123def456",
            notes: "50% upfront payment",
          },
        ],
      },
    },
  });

  // Invoice 3 - SENT (awaiting payment)
  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2024-003",
      companyId: company.id,
      clientId: buildersLLC.id,
      projectId: consultingProject.id,
      userId: admin.id,
      status: "SENT",
      issueDate: new Date("2024-03-01"),
      dueDate: new Date("2024-03-31"),
      subtotal: 25000,
      taxRate: 8.5,
      taxAmount: 2125,
      discount: 0,
      total: 27125,
      amountPaid: 0,
      notes: "Final consulting deliverables",
      terms: "NET 30",
      lineItems: {
        create: [
          {
            description: "Strategy Workshop - 3 days",
            quantity: 3,
            unitPrice: 5000,
            amount: 15000,
            category: "Consulting",
            order: 1,
          },
          {
            description: "Implementation Roadmap",
            quantity: 1,
            unitPrice: 10000,
            amount: 10000,
            category: "Consulting",
            order: 2,
          },
        ],
      },
    },
  });

  // Invoice 4 - DRAFT
  const invoice4 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2024-004",
      companyId: company.id,
      clientId: techCorp.id,
      projectId: websiteProject.id,
      userId: user.id,
      status: "DRAFT",
      issueDate: new Date("2024-03-15"),
      dueDate: new Date("2024-04-14"),
      subtotal: 20000,
      taxRate: 8.5,
      taxAmount: 1700,
      discount: 0,
      total: 21700,
      amountPaid: 0,
      notes: "Phase 2 - Development",
      terms: "NET 30",
      lineItems: {
        create: [
          {
            description: "Frontend Development - 100 hours",
            quantity: 100,
            unitPrice: 150,
            amount: 15000,
            category: "Development",
            order: 1,
          },
          {
            description: "Backend Development - 50 hours",
            quantity: 50,
            unitPrice: 150,
            amount: 7500,
            category: "Development",
            order: 2,
          },
          {
            description: "Quality Assurance - 25 hours",
            quantity: 25,
            unitPrice: 100,
            amount: 2500,
            category: "QA",
            order: 3,
          },
        ],
      },
    },
  });

  // Invoice 5 - OVERDUE
  const invoice5 = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2024-005",
      companyId: company.id,
      clientId: innovateInc.id,
      userId: accountant.id,
      status: "OVERDUE",
      issueDate: new Date("2024-01-15"),
      dueDate: new Date("2024-02-14"),
      subtotal: 8500,
      taxRate: 8.5,
      taxAmount: 722.5,
      discount: 0,
      total: 9222.5,
      amountPaid: 0,
      notes: "Monthly retainer - January 2024",
      terms: "NET 30 - OVERDUE",
    },
  });

  console.log("💸 Creating expenses...");
  await prisma.expense.create({
    data: {
      companyId: company.id,
      projectId: websiteProject.id,
      userId: user.id,
      description: "Adobe Creative Cloud Subscription",
      amount: 54.99,
      category: "SOFTWARE",
      expenseDate: new Date("2024-01-05"),
      status: "APPROVED",
      notes: "Monthly subscription for design tools",
    },
  });

  await prisma.expense.create({
    data: {
      companyId: company.id,
      projectId: appProject.id,
      userId: admin.id,
      description: "Client Meeting - Lunch",
      amount: 125.50,
      category: "MEALS",
      expenseDate: new Date("2024-02-10"),
      receipt: "https://example.com/receipts/lunch-feb10.pdf",
      status: "APPROVED",
      notes: "Meeting with Innovate Inc team",
    },
  });

  await prisma.expense.create({
    data: {
      companyId: company.id,
      userId: accountant.id,
      description: "Office Supplies - Printer Paper, Pens",
      amount: 89.99,
      category: "OFFICE_SUPPLIES",
      expenseDate: new Date("2024-03-01"),
      status: "PENDING",
    },
  });

  await prisma.expense.create({
    data: {
      companyId: company.id,
      projectId: consultingProject.id,
      userId: admin.id,
      description: "Travel to Client Site - Flight and Hotel",
      amount: 1250.00,
      category: "TRAVEL",
      expenseDate: new Date("2024-02-25"),
      receipt: "https://example.com/receipts/travel-feb25.pdf",
      status: "REIMBURSED",
      notes: "3-day consulting engagement in Denver",
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log("\n📊 Summary:");
  console.log(`  - Users: 3 (1 Admin, 1 Accountant, 1 User)`);
  console.log(`  - Company: 1`);
  console.log(`  - Clients: 3`);
  console.log(`  - Projects: 3`);
  console.log(`  - Invoices: 5 (1 PAID, 1 PARTIAL, 1 SENT, 1 DRAFT, 1 OVERDUE)`);
  console.log(`  - Expenses: 4`);
  console.log("\n🎓 You can now explore the data using Prisma Studio:");
  console.log("   npx prisma studio");
  console.log("\n💡 Or start building API routes and UI!");
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
