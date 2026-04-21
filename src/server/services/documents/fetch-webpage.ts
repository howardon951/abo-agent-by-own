import { logInfo } from "@/lib/utils/logger";

export async function fetchWebpage(url: string) {
  logInfo("document fetch webpage invoked", {
    url
  });
  return `Fetched content from ${url}`;
}
