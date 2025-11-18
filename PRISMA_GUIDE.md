# 📚 Prisma Invoice Management System - Learning Guide

This guide will help you understand the B2B Invoice Management System built with Prisma, Next.js 15, and SQLite.

## 🎯 What You'll Learn

This project demonstrates:
- **Prisma Schema Design**: Complex relationships, enums, indexes
- **CRUD Operations**: Create, Read, Update, Delete with Prisma
- **Relations**: One-to-many, optional relations
- **Transactions**: Ensuring data consistency
- **Aggregations**: Counting, summing, grouping
- **Real-world Business Logic**: Invoice calculations, payment processing
- **Next.js Integration**: Server components, API routes

---

## 🏗️ Database Schema Overview

### Core Models

#### 1. **User** - System users
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      UserRole @default(USER)
  active    Boolean  @default(true)
}
```
**Key Concepts:**
- `@id` - Primary key
- `@default(cuid())` - Auto-generate unique ID
- `@unique` - Enforce uniqueness
- Enums for role management

#### 2. **Company** - Your business details
```prisma
model Company {
  id      String  @id @default(cuid())
  name    String
  email   String
  // ... address fields
  taxRate Float   @default(0)
  clients Client[]  // One-to-many relation
}
```
**Key Concepts:**
- Optional fields with `?`
- Default values
- One-to-many relations

#### 3. **Client** - Your customers
```prisma
model Client {
  id        String  @id @default(cuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  invoices  Invoice[]
  projects  Project[]
}
```
**Key Concepts:**
- Foreign keys with `fields` and `references`
- Cascade deletes with `onDelete: Cascade`
- Indexes for performance with `@@index([companyId])`

#### 4. **Invoice** - The heart of the system
```prisma
model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique
  status        InvoiceStatus @default(DRAFT)

  // Financial fields
  subtotal      Float
  taxAmount     Float
  total         Float

  // Relations
  lineItems     InvoiceLineItem[]
  payments      Payment[]
}
```
**Key Concepts:**
- Enums for status management
- Multiple relations (one-to-many)
- Calculated fields (total, tax)

#### 5. **InvoiceLineItem** - Invoice details
**Key Concepts:**
- Child records
- Ordering with `order` field
- Cascade deletes

#### 6. **Payment** - Payment tracking
**Key Concepts:**
- Transaction records
- Relations to invoices
- Payment methods enum

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Set Up Database
```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed
```

### 3. Explore Data
```bash
# Open Prisma Studio (visual database browser)
pnpm db:studio
```

### 4. Run the App
```bash
pnpm dev
```

Visit `http://localhost:3000/invoices` to see the dashboard.

---

## 💡 Key Prisma Patterns

### 1. Creating Records with Relations

**Example: Creating an invoice with line items**
```typescript
const invoice = await prisma.invoice.create({
  data: {
    invoiceNumber: "INV-2024-001",
    companyId: company.id,
    clientId: client.id,
    total: 1000,
    // Create related line items
    lineItems: {
      create: [
        {
          description: "Consulting services",
          quantity: 10,
          unitPrice: 100,
          amount: 1000,
        },
      ],
    },
  },
  include: {
    lineItems: true, // Include line items in response
  },
});
```

**Location**: `prisma/seed.ts` (lines 135-200)

### 2. Querying with Relations

**Example: Fetch invoice with all related data**
```typescript
const invoice = await prisma.invoice.findUnique({
  where: { id: invoiceId },
  include: {
    client: true,
    project: true,
    lineItems: true,
    payments: true,
  },
});
```

**Location**: `app/api/invoices/[id]/route.ts` (lines 20-40)

### 3. Filtering and Searching

**Example: Find all paid invoices for a client**
```typescript
const invoices = await prisma.invoice.findMany({
  where: {
    clientId: clientId,
    status: "PAID",
  },
  orderBy: {
    createdAt: "desc",
  },
});
```

**Location**: `app/api/invoices/route.ts` (lines 30-55)

### 4. Aggregations

**Example: Calculate total revenue**
```typescript
const stats = await prisma.invoice.aggregate({
  where: { companyId },
  _sum: {
    total: true,
    amountPaid: true,
  },
  _count: true,
  _avg: {
    total: true,
  },
});
```

**Location**: `app/api/dashboard/route.ts` (lines 35-45)

### 5. Group By

**Example: Revenue by status**
```typescript
const revenueByStatus = await prisma.invoice.groupBy({
  by: ["status"],
  where: { companyId },
  _sum: {
    total: true,
  },
  _count: true,
});
```

**Location**: `app/api/dashboard/route.ts` (lines 50-60)

### 6. Transactions

**Example: Create payment and update invoice**
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create payment
  const payment = await tx.payment.create({
    data: {
      invoiceId: invoiceId,
      amount: 500,
    },
  });

  // Update invoice
  const invoice = await tx.invoice.update({
    where: { id: invoiceId },
    data: {
      amountPaid: {
        increment: 500,
      },
      status: "PARTIAL",
    },
  });

  return { payment, invoice };
});
```

**Location**: `app/api/payments/route.ts` (lines 25-70)

### 7. Counting Relations

**Example: Count invoices per client**
```typescript
const clients = await prisma.client.findMany({
  include: {
    _count: {
      select: {
        invoices: true,
        projects: true,
      },
    },
  },
});
```

**Location**: `app/api/clients/route.ts` (lines 35-50)

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema (START HERE!)
│   ├── seed.ts                # Sample data generator
│   └── migrations/            # Database migrations
├── lib/
│   └── prisma.ts              # Prisma Client singleton
├── app/
│   ├── api/                   # API routes
│   │   ├── clients/           # Client CRUD operations
│   │   ├── invoices/          # Invoice CRUD operations
│   │   ├── payments/          # Payment processing
│   │   └── dashboard/         # Dashboard statistics
│   └── invoices/
│       └── page.tsx           # Invoice dashboard UI
└── PRISMA_GUIDE.md           # This file
```

---

## 🔍 Exploring the Code

### Step 1: Understand the Schema
**File**: `prisma/schema.prisma`

Start here to understand:
- Data models and their fields
- Relationships between models
- Enums and their values
- Indexes for performance

### Step 2: Study the Seed Script
**File**: `prisma/seed.ts`

Learn how to:
- Create records with Prisma
- Handle relations
- Work with dates and numbers
- Clean and reset data

### Step 3: Explore API Routes
**Files**: `app/api/**/*.ts`

Examples of:
- GET requests (fetching data)
- POST requests (creating data)
- PATCH requests (updating data)
- DELETE requests (removing data)
- Error handling
- Validation

### Step 4: Check the UI
**File**: `app/invoices/page.tsx`

See how to:
- Fetch data in Server Components
- Display Prisma data in React
- Format dates and currency
- Create responsive tables

---

## 🎓 Learning Exercises

### Exercise 1: Add a New Field
1. Add a `discount` field to the Client model
2. Run `pnpm db:migrate` to create a migration
3. Update the seed script to include discounts
4. Display it in the UI

### Exercise 2: Create a New API Route
Create `app/api/expenses/route.ts` to:
- List all expenses
- Filter by category
- Calculate total by category

### Exercise 3: Add a Complex Query
Create an endpoint that returns:
- Clients with overdue invoices
- Total amount overdue per client
- Days overdue for each invoice

### Exercise 4: Implement Soft Deletes
Instead of deleting records:
- Add a `deleted` boolean field
- Modify queries to exclude deleted records
- Create an "archive" feature

---

## 📊 Database Visualization

```
Company (1) ─────┬───────→ (∞) Clients
                 │
                 ├───────→ (∞) Projects
                 │
                 └───────→ (∞) Invoices

Client (1) ──────┬───────→ (∞) Invoices
                 │
                 └───────→ (∞) Projects

Invoice (1) ─────┬───────→ (∞) LineItems
                 │
                 └───────→ (∞) Payments

Project (1) ─────→ (∞) Invoices
```

---

## 🛠️ Useful Commands

```bash
# Database
pnpm db:generate        # Generate Prisma Client
pnpm db:migrate         # Create and run migration
pnpm db:seed           # Seed database with sample data
pnpm db:studio         # Open Prisma Studio

# Development
pnpm dev               # Start dev server
pnpm build             # Build for production
```

---

## 🔥 Advanced Patterns

### 1. Soft Deletes
Add a `deletedAt` field and filter it in queries:
```typescript
const activeClients = await prisma.client.findMany({
  where: {
    deletedAt: null,
  },
});
```

### 2. Pagination
```typescript
const page = 1;
const pageSize = 20;

const [invoices, total] = await Promise.all([
  prisma.invoice.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
  }),
  prisma.invoice.count(),
]);
```

### 3. Search
```typescript
const results = await prisma.client.findMany({
  where: {
    OR: [
      { name: { contains: searchTerm } },
      { email: { contains: searchTerm } },
    ],
  },
});
```

### 4. Batch Operations
```typescript
// Update multiple records
await prisma.invoice.updateMany({
  where: {
    status: "SENT",
    dueDate: {
      lt: new Date(),
    },
  },
  data: {
    status: "OVERDUE",
  },
});
```

---

## 🎯 Next Steps

1. **Explore Prisma Studio**: Run `pnpm db:studio` and click around
2. **Read the Schema**: Open `prisma/schema.prisma` and read all comments
3. **Test the APIs**: Use tools like Postman or curl to test endpoints
4. **Modify the Code**: Try adding new features or models
5. **Check Prisma Docs**: Visit [prisma.io/docs](https://www.prisma.io/docs)

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Next.js with Prisma](https://www.prisma.io/nextjs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

---

## 💬 Sample API Requests

### Get All Invoices
```bash
curl http://localhost:3000/api/invoices
```

### Get Invoice by ID
```bash
curl http://localhost:3000/api/invoices/{id}
```

### Create a Payment
```bash
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceId": "...",
    "amount": 1000,
    "paymentMethod": "BANK_TRANSFER"
  }'
```

### Get Dashboard Stats
```bash
curl http://localhost:3000/api/dashboard?companyId={companyId}
```

---

## 🎉 Congratulations!

You now have a fully functional B2B Invoice Management System with:
- ✅ 8 database models
- ✅ Complex relationships
- ✅ CRUD API endpoints
- ✅ Real-world business logic
- ✅ Sample data to explore
- ✅ A visual dashboard

**Happy Learning!** 🚀
