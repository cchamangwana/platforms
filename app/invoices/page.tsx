import prisma from "@/lib/prisma";
import Link from "next/link";

/**
 * Invoice Management Dashboard
 *
 * This demonstrates:
 * - Server-side data fetching with Prisma in Next.js App Router
 * - Displaying data with Tailwind CSS
 * - Formatting dates and currency
 * - Status badges
 */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PAID: "bg-green-100 text-green-800",
    PARTIAL: "bg-blue-100 text-blue-800",
    SENT: "bg-yellow-100 text-yellow-800",
    DRAFT: "bg-gray-100 text-gray-800",
    OVERDUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export default async function InvoicesPage() {
  // Fetch all invoices with related data
  const invoices = await prisma.invoice.findMany({
    include: {
      client: {
        select: {
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          lineItems: true,
          payments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calculate summary statistics
  const stats = {
    total: invoices.length,
    totalRevenue: invoices.reduce((sum, inv) => sum + inv.total, 0),
    totalPaid: invoices.reduce((sum, inv) => sum + inv.amountPaid, 0),
    draft: invoices.filter((inv) => inv.status === "DRAFT").length,
    sent: invoices.filter((inv) => inv.status === "SENT").length,
    paid: invoices.filter((inv) => inv.status === "PAID").length,
    overdue: invoices.filter((inv) => inv.status === "OVERDUE").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Invoice Management System
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            A comprehensive B2B invoice management demo built with Prisma and
            Next.js
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">
              Total Revenue
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Paid</div>
            <div className="mt-2 text-3xl font-semibold text-green-600">
              {formatCurrency(stats.totalPaid)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Outstanding</div>
            <div className="mt-2 text-3xl font-semibold text-orange-600">
              {formatCurrency(stats.totalRevenue - stats.totalPaid)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">
              Total Invoices
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {stats.total}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Invoice Status
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {stats.draft}
              </div>
              <div className="text-sm text-gray-500">Draft</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.sent}
              </div>
              <div className="text-sm text-gray-500">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.paid}
              </div>
              <div className="text-sm text-gray-500">Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.overdue}
              </div>
              <div className="text-sm text-gray-500">Overdue</div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Invoices
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.client.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.client.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.project?.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(invoice.amountPaid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with helpful links */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            🎓 Learning Resources
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>
              • Check out the{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded">
                prisma/schema.prisma
              </code>{" "}
              file to understand the data model
            </li>
            <li>
              • Explore the{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded">
                app/api
              </code>{" "}
              folder for API route examples
            </li>
            <li>
              • Run{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded">
                npx prisma studio
              </code>{" "}
              to visually explore and edit your data
            </li>
            <li>
              • See{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded">
                prisma/seed.ts
              </code>{" "}
              for examples of creating data
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
