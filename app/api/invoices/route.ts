import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/invoices
 * Fetches invoices with filtering and pagination
 *
 * Query params:
 * - status: InvoiceStatus (filter by status)
 * - clientId: string (filter by client)
 * - projectId: string (filter by project)
 * - limit: number (pagination)
 * - offset: number (pagination)
 *
 * This demonstrates:
 * - Complex filtering with where clauses
 * - Including nested relations (client, project, lineItems, payments)
 * - Pagination
 * - Ordering results
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where = {
      ...(status && { status: status as any }),
      ...(clientId && { clientId }),
      ...(projectId && { projectId }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          lineItems: true,
          payments: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoices
 * Creates a new invoice with line items
 *
 * This demonstrates:
 * - Creating records with nested data (lineItems)
 * - Transactions for data consistency
 * - Calculations (totals)
 * - Auto-generating unique IDs (invoice number)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (
      !body.companyId ||
      !body.clientId ||
      !body.userId ||
      !body.dueDate ||
      !body.lineItems ||
      body.lineItems.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: companyId, clientId, userId, dueDate, lineItems",
        },
        { status: 400 }
      );
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber =
      body.invoiceNumber ||
      `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(3, "0")}`;

    // Calculate totals from line items
    const subtotal = body.lineItems.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxRate = body.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discount = body.discount || 0;
    const total = subtotal + taxAmount - discount;

    // Create invoice with line items in a transaction
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        companyId: body.companyId,
        clientId: body.clientId,
        projectId: body.projectId || null,
        userId: body.userId,
        status: body.status || "DRAFT",
        issueDate: new Date(body.issueDate || Date.now()),
        dueDate: new Date(body.dueDate),
        subtotal,
        taxRate,
        taxAmount,
        discount,
        total,
        notes: body.notes || null,
        terms: body.terms || null,
        lineItems: {
          create: body.lineItems.map((item: any, index: number) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            category: item.category || null,
            order: index,
          })),
        },
      },
      include: {
        lineItems: true,
        client: true,
        project: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
