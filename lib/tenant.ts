import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { Tenant } from "./generated/prisma";

/**
 * Tenant Context Utility
 *
 * This module provides utilities for extracting and working with
 * tenant context in a multi-tenant Next.js application.
 */

/**
 * Get the current subdomain from the request headers
 */
export async function getSubdomain(): Promise<string | null> {
  const headersList = await headers();
  const host = headersList.get("host");

  if (!host) return null;

  // Extract subdomain from host
  // Supports:
  // - acme.localhost:3000 -> acme
  // - techcorp.example.com -> techcorp
  // - example.com -> null (no subdomain)
  const parts = host.split(".");

  // Handle localhost (acme.localhost:3000)
  if (host.includes(".localhost")) {
    const subdomain = host.split(".localhost")[0].split(":")[0];
    return subdomain || null;
  }

  // Handle production domains (acme.example.com)
  if (parts.length >= 3) {
    // Remove port if present
    return parts[0].split(":")[0];
  }

  return null;
}

/**
 * Get the current tenant from the database based on subdomain
 */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const subdomain = await getSubdomain();

  if (!subdomain) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
  });

  return tenant;
}

/**
 * Get tenant ID from subdomain (faster, no full tenant data)
 */
export async function getTenantId(): Promise<string | null> {
  const subdomain = await getSubdomain();

  if (!subdomain) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { subdomain },
    select: { id: true },
  });

  return tenant?.id || null;
}

/**
 * Require a tenant context (throws error if not found)
 * Use this in pages/routes that MUST have a tenant
 */
export async function requireTenant(): Promise<Tenant> {
  const tenant = await getCurrentTenant();

  if (!tenant) {
    throw new Error("Tenant not found. This page requires a valid subdomain.");
  }

  if (!tenant.active) {
    throw new Error("This tenant account is inactive.");
  }

  return tenant;
}
