import { executeAIChat } from "../src/lib/ai/aiService";

async function run() {
  try {
    const res = await executeAIChat({
      conversationId: "test_convo_" + Date.now(),
      messages: [{ role: "user", content: "Hello! What can you help me cook?" }],
    });
    console.log("STATUS: SUCCESS");
    console.log("MODEL:", res.modelUsed);
    console.log("REPLY:", res.message);
  } catch (err: any) {
    console.error("STATUS: ERROR", err?.message || err);
    process.exit(1);
  }
}

run();

