import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import {
  connectLineChannel,
  getLineChannelConnection
} from "@/server/domain/channel/connect-line-channel";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

const schema = z.object({
  name: z.string().min(1),
  channelIdExternal: z.string().optional(),
  channelSecret: z.string().min(1),
  channelAccessToken: z.string().min(1)
});

export async function GET() {
  return runTenantScopedRoute(async (user) => {
    return ok(await getLineChannelConnection(user.tenantId));
  });
}

export async function POST(request: Request) {
  return runTenantScopedRoute(async (user) => {
    const json = await request.json().catch(() => null);
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "invalid line channel payload");
    }

    return ok(
      await connectLineChannel({
        tenantId: user.tenantId,
        ...parsed.data
      })
    );
  });
}
