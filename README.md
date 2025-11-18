# Next.js Multi-Tenant Example

A production-ready example of a multi-tenant application built with Next.js 15, featuring custom subdomains for each tenant.

## Features

### Multi-Tenant Platform
- ✅ Custom subdomain routing with Next.js middleware
- ✅ Tenant-specific content and pages
- ✅ Shared components and layouts across tenants
- ✅ Redis for tenant data storage
- ✅ Admin interface for managing tenants
- ✅ Emoji support for tenant branding
- ✅ Support for local development with subdomains
- ✅ Compatible with Vercel preview deployments

### 🆕 Prisma Invoice Management System (Learning Template)
- ✅ Complete B2B invoice management system
- ✅ Comprehensive Prisma schema with 8+ models
- ✅ Real-world business logic examples
- ✅ RESTful API routes with CRUD operations
- ✅ Dashboard with statistics and reporting
- ✅ Sample data seeding for testing
- ✅ Detailed learning guide and documentation

**[📚 View the Prisma Learning Guide →](./PRISMA_GUIDE.md)**

## Tech Stack

- [Next.js 15](https://nextjs.org/) with App Router
- [React 19](https://react.dev/)
- [Upstash Redis](https://upstash.com/) for tenant data storage
- [Prisma](https://www.prisma.io/) - Modern ORM for database management
- [SQLite](https://www.sqlite.org/) - Database for invoice management demo
- [Tailwind 4](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) for the design system

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- pnpm (recommended) or npm/yarn
- Upstash Redis account (for production)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/vercel/platforms.git
   cd platforms
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with:

   ```
   KV_REST_API_URL=your_redis_url
   KV_REST_API_TOKEN=your_redis_token
   ```

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Set up the Prisma database (optional - for invoice management demo):

   ```bash
   pnpm db:generate    # Generate Prisma Client
   pnpm db:migrate     # Run database migrations
   pnpm db:seed        # Seed with sample data
   ```

6. Access the application:
   - Main site: http://localhost:3000
   - Admin panel: http://localhost:3000/admin
   - Tenants: http://[tenant-name].localhost:3000
   - **Invoice Dashboard: http://localhost:3000/invoices** (Prisma demo)
   - **Prisma Studio: Run `pnpm db:studio`** (Database GUI)

## Multi-Tenant Architecture

This application demonstrates a subdomain-based multi-tenant architecture where:

- Each tenant gets their own subdomain (`tenant.yourdomain.com`)
- The middleware handles routing requests to the correct tenant
- Tenant data is stored in Redis using a `subdomain:{name}` key pattern
- The main domain hosts the landing page and admin interface
- Subdomains are dynamically mapped to tenant-specific content

The middleware (`middleware.ts`) intelligently detects subdomains across various environments (local development, production, and Vercel preview deployments).

## Deployment

This application is designed to be deployed on Vercel. To deploy:

1. Push your repository to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy

For custom domains, make sure to:

1. Add your root domain to Vercel
2. Set up a wildcard DNS record (`*.yourdomain.com`) on Vercel

---

## 📚 Prisma Invoice Management System

This repository includes a complete **B2B Invoice Management System** built with Prisma as a learning template. It's perfect for understanding how to build real-world applications with Prisma ORM.

### What's Included

- **8 Database Models**: User, Company, Client, Project, Invoice, InvoiceLineItem, Payment, Expense
- **Complex Relationships**: One-to-many, optional relations, cascade deletes
- **Real Business Logic**: Invoice calculations, payment processing, status management
- **API Routes**: Complete CRUD operations with validation
- **Dashboard UI**: Statistics, tables, and data visualization
- **Sample Data**: Pre-seeded realistic data for testing

### Quick Start

```bash
# Set up the database
pnpm db:generate && pnpm db:migrate && pnpm db:seed

# Start the dev server
pnpm dev

# Visit the invoice dashboard
open http://localhost:3000/invoices

# Explore the database visually
pnpm db:studio
```

### Learning Resources

- 📖 **[Complete Prisma Learning Guide](./PRISMA_GUIDE.md)** - Comprehensive guide with examples
- 🗂️ **Database Schema**: `prisma/schema.prisma` - Well-commented schema
- 🌱 **Seed Script**: `prisma/seed.ts` - Learn how to create data
- 🔌 **API Examples**: `app/api/*` - RESTful API patterns
- 🎨 **UI Example**: `app/invoices/page.tsx` - Server-side rendering with Prisma

### Key Features to Learn

1. **Schema Design**: Complex relations, enums, indexes
2. **CRUD Operations**: Create, read, update, delete patterns
3. **Transactions**: Ensuring data consistency
4. **Aggregations**: Counting, summing, grouping data
5. **Filtering**: Complex where clauses and searches
6. **Pagination**: Efficient data loading
7. **Relations**: Including and querying related data

### Database Commands

```bash
pnpm db:generate    # Generate Prisma Client from schema
pnpm db:migrate     # Create and apply database migrations
pnpm db:seed        # Populate database with sample data
pnpm db:studio      # Open Prisma Studio (database GUI)
```

---
