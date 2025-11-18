import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/invoices/[id]
 * Fetches a single invoice with all related data
 *
 * This demonstrates:
 * - Finding by unique ID
 * - Including multiple nested relations
 * - Complex data fetching
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: true,
        client: true,
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          orderBy: {
            order: "asc",
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/invoices/[id]
 * Updates an invoice
 *
 * This demonstrates:
 * - Updating with recalculations
 * - Conditional updates
 * - Status management
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // If line items are updated, recalculate totals
    let updateData: any = {
      ...(body.status && { status: body.status }),
      ...(body.dueDate && { dueDate: new Date(body.dueDate) }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.terms !== undefined && { terms: body.terms }),
    };

    // If updating to PAID status, set paidDate
    if (body.status === "PAID") {
      updateData.paidDate = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        lineItems: true,
        payments: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoices/[id]
 * Deletes an invoice
 *
 * This demonstrates:
 * - Deleting records
 * - Cascade deletes for line items and payments
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
