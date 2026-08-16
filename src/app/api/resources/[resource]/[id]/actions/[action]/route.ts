import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { ForbiddenError } from "@/lib/rbac";
import {
  executeResourceAction,
  NotFoundError,
  ValidationError,
} from "@/lib/resources/actions";
import { getResource } from "@/lib/resources/registry";

const bodySchema = z.object({
  reason: z.string().max(2000).optional(),
  category: z.string().max(200).optional(),
});

type RouteParams = {
  params: { resource: string; id: string; action: string };
};

export async function POST(request: NextRequest, { params }: RouteParams) {
  const resource = getResource(params.resource);
  if (!resource) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const after = await executeResourceAction(
      resource,
      params.action,
      user,
      params.id,
      parsed.data.reason,
      parsed.data.category,
    );
    return NextResponse.json({ ok: true, row: after });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
