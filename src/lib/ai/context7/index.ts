import { Context7 } from "@upstash/context7-sdk";
import { tool } from "ai";
import z from "zod";

const client = new Context7();

async function getDocsForPrompt(library: string, question: string) {
  const context = await client.getContext(question, library);

  return `
Here is the relevant documentation:

${context}

User question: ${question}
`;
}

export const getGeoGebraDocsTool = tool({
  description: "Get documentation for a library",
  inputSchema: z.object({
    question: z.string(),
  }),
  execute: async ({ question }: { question: string }) => {
    return getDocsForPrompt("/geogebra/manual", question);
  },
});
