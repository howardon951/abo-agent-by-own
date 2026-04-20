import { processMessageJob } from "@/worker/process-message-job";

async function main() {
  const result = await processMessageJob();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
