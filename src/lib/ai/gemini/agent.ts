import { google } from "@ai-sdk/google";
import { ToolLoopAgent } from "ai";
import { getGeoGebraDocsTool } from "../context7";

export const geogebraAgent = new ToolLoopAgent({
  model: google("gemini-2.5-flash-preview-09-2025"),
  tools: {
    getGeoGebraDocsTool,
  },
});
