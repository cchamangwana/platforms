import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/clients
 * Fetches all clients with optional filtering
 *
 * Query params:
 * - active: boolean (filter by active status)
 * - companyId: string (filter by company)
 *
 * This demonstrates:
 * - Basic Prisma queries
 * - Filtering with where clauses
 * - Ordering results
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get("active");
    const companyId = searchParams.get("companyId");

    const clients = await prisma.client.findMany({
      where: {
        ...(active !== null && { active: active === "true" }),
        ...(companyId && { companyId }),
      },
      include: {
        _count: {
          select: {
            invoices: true,
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Creates a new client
 *
 * This demonstrates:
 * - Creating records with Prisma
 * - Validation
 * - Error handling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.email || !body.companyId) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, companyId" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        companyId: body.companyId,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        postalCode: body.postalCode || null,
        country: body.country || null,
        taxId: body.taxId || null,
        active: body.active ?? true,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
