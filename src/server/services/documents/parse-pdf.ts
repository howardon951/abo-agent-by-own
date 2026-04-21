import { logInfo } from "@/lib/utils/logger";

export async function parsePdf(_storagePath: string) {
  logInfo("document parse pdf invoked", {
    storagePath: _storagePath
  });
  return "PDF parsing stub";
}
