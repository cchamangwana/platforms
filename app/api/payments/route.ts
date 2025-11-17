import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/payments
 * Creates a payment for an invoice
 *
 * This demonstrates:
 * - Creating a payment
 * - Updating related invoice status based on payment
 * - Using transactions for data consistency
 * - Complex business logic
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation
    if (!body.invoiceId || !body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: "Missing required fields: invoiceId, amount (must be > 0)" },
        { status: 400 }
      );
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get the invoice
      const invoice = await tx.invoice.findUnique({
        where: { id: body.invoiceId },
        include: { payments: true },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Check if payment amount is valid
      const remainingAmount = invoice.total - invoice.amountPaid;
      if (body.amount > remainingAmount) {
        throw new Error(
          `Payment amount ($${body.amount}) exceeds remaining balance ($${remainingAmount})`
        );
      }

      // Create the payment
      const payment = await tx.payment.create({
        data: {
          invoiceId: body.invoiceId,
          amount: body.amount,
          paymentDate: new Date(body.paymentDate || Date.now()),
          paymentMethod: body.paymentMethod || "BANK_TRANSFER",
          reference: body.reference || null,
          notes: body.notes || null,
        },
      });

      // Update invoice amountPaid and status
      const newAmountPaid = invoice.amountPaid + body.amount;
      let newStatus = invoice.status;

      if (newAmountPaid >= invoice.total) {
        newStatus = "PAID";
      } else if (newAmountPaid > 0) {
        newStatus = "PARTIAL";
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: body.invoiceId },
        data: {
          amountPaid: newAmountPaid,
          status: newStatus,
          ...(newStatus === "PAID" && { paidDate: new Date() }),
        },
      });

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment" },
      { status: 500 }
    );
  }
}
