import { createAgentUIStreamResponse, smoothStream, type UIMessage } from "ai";
import { geogebraAgent } from "@/lib/ai/gemini/agent";

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const abortController = new AbortController();

  // Handle client disconnect
  req.signal.addEventListener("abort", () => {
    abortController.abort();
  });

  return createAgentUIStreamResponse({
    agent: geogebraAgent,
    uiMessages: messages,
    experimental_transform: smoothStream({ chunking: "word" }),
    sendReasoning: true,
    abortSignal: abortController.signal,
  });
}
