import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import { connectLineChannel } from "@/server/domain/channel/connect-line-channel";

const schema = z.object({
  name: z.string().min(1),
  channelIdExternal: z.string().optional(),
  channelSecret: z.string().min(1),
  channelAccessToken: z.string().min(1)
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "invalid line channel payload");
  }

  return ok(await connectLineChannel(parsed.data));
}
