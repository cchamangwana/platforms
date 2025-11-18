import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/clients/[id]
 * Fetches a single client by ID with related data
 *
 * This demonstrates:
 * - Finding a single record
 * - Including related data (invoices, projects)
 * - Aggregating data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        company: true,
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        projects: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Calculate client statistics
    const stats = await prisma.invoice.aggregate({
      where: { clientId: id },
      _sum: {
        total: true,
        amountPaid: true,
      },
      _count: true,
    });

    return NextResponse.json({
      ...client,
      stats: {
        totalInvoiced: stats._sum.total || 0,
        totalPaid: stats._sum.amountPaid || 0,
        invoiceCount: stats._count,
      },
    });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/[id]
 * Updates a client
 *
 * This demonstrates:
 * - Updating records
 * - Partial updates
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const client = await prisma.client.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.email && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.website !== undefined && { website: body.website }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.postalCode !== undefined && { postalCode: body.postalCode }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.taxId !== undefined && { taxId: body.taxId }),
        ...(body.active !== undefined && { active: body.active }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]
 * Deletes a client
 *
 * This demonstrates:
 * - Deleting records
 * - Cascade deletes (defined in schema)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
