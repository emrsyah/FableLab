"use client";

import { useEffect, useRef, useState } from "react";

interface P5WidgetProps {
  code: string;
  width?: number | string;
  height?: number | string;
  className?: string;
}

/**
 * P5Widget - Renders p5.js sketches in a sandboxed iframe
 *
 * Uses an iframe with srcdoc to safely execute p5.js code
 * without polluting the main window context.
 *
 * Now optimized for complex 5-phase experiments with sidebar UI.
 */
export function P5Widget({
  code,
  width = "100%",
  height = "100%",
  className = "",
}: P5WidgetProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    // Create the HTML document for the iframe
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      background: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    main {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    #sketch-container, #canvas-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      height: 100%;
    }
    canvas {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      border-radius: 12px;
      max-width: 100%;
      max-height: 100%;
    }

    /* Enhanced styling for p5 DOM elements */
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      outline: none;
      margin: 8px 0;
    }
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      background: #3b82f6;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      background: #3b82f6;
      border-radius: 50%;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    select {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: white;
      font-size: 14px;
      cursor: pointer;
      outline: none;
      width: 100%;
    }
    select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    input[type="text"] {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      width: 100%;
    }
    input[type="text"]:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    button {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);
    }
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 8px -1px rgba(59, 130, 246, 0.4);
    }
    button:active {
      transform: translateY(0);
    }

    /* Control button variant */
    button.control-button {
      background: linear-gradient(135deg, #10b981, #059669);
      box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
    }
    button.control-button:hover {
      box-shadow: 0 6px 8px -1px rgba(16, 185, 129, 0.4);
    }

    /* Predict button variant */
    button.predict-button {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);
    }
    button.predict-button:hover {
      box-shadow: 0 6px 8px -1px rgba(245, 158, 11, 0.4);
    }

    .controls-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      padding: 16px;
      background: white;
      border-radius: 12px;
      margin-top: 16px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
      max-width: 100%;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/p5@1.11.2/lib/p5.min.js"></script>
</head>
<body>
  <main id="sketch-container">
    <div id="canvas-container"></div>
  </main>
  <script>
    // Error handling - defined in separate script to catch syntax errors in user code
    window.onerror = function(msg, url, line, col, error) {
      parent.postMessage({
        type: 'p5-error',
        message: msg,
        line: line,
        column: col,
        stack: error?.stack
      }, '*');
      return true;
    };

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      parent.postMessage({
        type: 'p5-error',
        message: 'Unhandled promise: ' + event.reason,
      }, '*');
    });
  </script>
  <script>
    // User's p5.js code
    ${code.replace(/<\/script>/g, "<\\/script>")}
  </script>
</body>
</html>
    `.trim();

    // Set the iframe content
    if (iframeRef.current) {
      console.log("htmlContent", htmlContent);
      iframeRef.current.srcdoc = htmlContent;
    }

    // Listen for errors from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "p5-error") {
        console.error("p5.js error:", event.data);
        setError(
          `Error: ${event.data.message}${event.data.line ? ` (line ${event.data.line})` : ""}`,
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [code]);

  // Extract canvas dimensions from code
  const [canvasSize, setCanvasSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    // Try to find createCanvas(width, height) or createCanvas(width, height, renderer)
    const match = code.match(
      /createCanvas\s*\(\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*\w+)?\s*\)/,
    );
    if (match) {
      setCanvasSize({ width: parseInt(match[1]), height: parseInt(match[2]) });
    } else {
      setCanvasSize(null);
    }
  }, [code]);

  if (!code) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <p className="text-gray-500">No p5.js code to display</p>
      </div>
    );
  }

  // For complex experiments with sidebars (like the 5-phase pipeline),
  // we need to ensure the iframe is large enough to show all controls
  // The p5.js code uses createCanvas(900, 600) + sidebar (250px) = ~1150px width
  const DEFAULT_EXPERIMENT_WIDTH = 900;
  const SIDEBAR_WIDTH = 250;
  const TOTAL_WIDTH = DEFAULT_EXPERIMENT_WIDTH + SIDEBAR_WIDTH;
  const DEFAULT_EXPERIMENT_HEIGHT = 600;
  const CONTROLS_PADDING = 100; // Extra space for phase controls

  // Calculate dimensions
  const contentWidth = canvasSize
    ? Math.max(canvasSize.width + SIDEBAR_WIDTH, TOTAL_WIDTH)
    : TOTAL_WIDTH;
  const contentHeight = canvasSize
    ? canvasSize.height + CONTROLS_PADDING
    : DEFAULT_EXPERIMENT_HEIGHT + CONTROLS_PADDING;

  // Resolve dimensions - prefer explicit content dimensions for experiments
  const resolvedWidth =
    typeof width === "number"
      ? width
      : contentWidth
        ? `${contentWidth}px`
        : width;

  const resolvedHeight =
    typeof height === "number"
      ? height
      : contentHeight
        ? `${Math.max(contentHeight, 600)}px`
        : height;

  return (
    <div
      className={`relative overflow-auto ${className}`}
      style={{
        width: typeof width === "number" ? width : "100%",
        height: typeof height === "number" ? height : "100%",
        minHeight: "500px",
      }}
    >
      <div>{/* {code} */}</div>
      {error && (
        <div className="absolute top-2 left-2 right-2 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm z-10 shadow-sm">
          <p className="font-semibold">Experiment Error</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="p5.js Sketch"
        style={{
          width: resolvedWidth,
          height: resolvedHeight,
          minWidth: "100%",
          minHeight: "100%",
        }}
        className="border-0 rounded-lg bg-white shadow-lg block"
        sandbox="allow-scripts allow-same-origin"
        scrolling="auto"
      />
    </div>
  );
}
