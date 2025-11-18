import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/dashboard
 * Fetches dashboard statistics and overview data
 *
 * This demonstrates:
 * - Aggregation queries (sum, count, avg)
 * - Group by operations
 * - Complex filtering
 * - Combining multiple queries
 * - Date-based filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    // Run multiple queries in parallel
    const [
      invoiceStats,
      revenueByStatus,
      recentInvoices,
      overdueInvoices,
      topClients,
      expenseSummary,
    ] = await Promise.all([
      // Overall invoice statistics
      prisma.invoice.aggregate({
        where: { companyId },
        _sum: {
          total: true,
          amountPaid: true,
        },
        _count: true,
      }),

      // Revenue breakdown by status
      prisma.invoice.groupBy({
        by: ["status"],
        where: { companyId },
        _sum: {
          total: true,
          amountPaid: true,
        },
        _count: true,
      }),

      // Recent invoices (last 10)
      prisma.invoice.findMany({
        where: { companyId },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      }),

      // Overdue invoices
      prisma.invoice.findMany({
        where: {
          companyId,
          status: {
            in: ["SENT", "VIEWED", "PARTIAL"],
          },
          dueDate: {
            lt: new Date(),
          },
        },
        include: {
          client: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      }),

      // Top clients by total invoiced
      prisma.invoice.groupBy({
        by: ["clientId"],
        where: { companyId },
        _sum: {
          total: true,
          amountPaid: true,
        },
        _count: true,
        orderBy: {
          _sum: {
            total: "desc",
          },
        },
        take: 5,
      }),

      // Expense summary
      prisma.expense.aggregate({
        where: { companyId },
        _sum: {
          amount: true,
        },
        _count: true,
      }),
    ]);

    // Fetch client details for top clients
    const clientIds = topClients.map((c) => c.clientId);
    const clients = await prisma.client.findMany({
      where: {
        id: {
          in: clientIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Merge client data with aggregated data
    const topClientsWithDetails = topClients.map((tc) => ({
      ...tc,
      client: clients.find((c) => c.id === tc.clientId),
    }));

    // Calculate metrics
    const totalRevenue = invoiceStats._sum.total || 0;
    const totalPaid = invoiceStats._sum.amountPaid || 0;
    const totalOutstanding = totalRevenue - totalPaid;

    const response = {
      overview: {
        totalRevenue,
        totalPaid,
        totalOutstanding,
        invoiceCount: invoiceStats._count,
        totalExpenses: expenseSummary._sum.amount || 0,
        expenseCount: expenseSummary._count,
      },
      revenueByStatus: revenueByStatus.map((r) => ({
        status: r.status,
        total: r._sum.total || 0,
        paid: r._sum.amountPaid || 0,
        count: r._count,
      })),
      recentInvoices,
      overdueInvoices,
      topClients: topClientsWithDetails,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
