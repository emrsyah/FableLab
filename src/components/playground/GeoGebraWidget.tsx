"use client";

import { useEffect, useRef, useState } from "react";
import type { GeoGebraConfig, GeoGebraParameter } from "@/types/geogebra";

interface GeoGebraWidgetProps {
  config: GeoGebraConfig | null;
  width?: number;
  height?: number;
  onInit?: (api: any) => void;
  onUpdate?: (state: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function GeoGebraWidget({
  config,
  width = 800,
  height = 600,
  onInit,
  onUpdate,
  onError,
  className = "",
}: GeoGebraWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [_isLoaded, setIsLoaded] = useState(false);

  const onInitRef = useRef(onInit);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  onInitRef.current = onInit;

  useEffect(() => {
    if (!config) return;

    const configData = config;
    let mounted = true;
    let applet: any = null;

    async function initGeoGebra() {
      // Load script if not already loaded
      if (!(window as any).GGBApplet) {
        const script = document.createElement("script");
        script.src = "https://www.geogebra.org/apps/deployggb.js";
        script.async = true;
        document.head.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      if (!mounted || !containerRef.current) return;

      // Create applet
      const params = {
        appName: "classic",
        width,
        height,
        showToolBar: false,
        showAlgebraInput: false,
        showMenuBar: false,
        enableRightClick: true,
        showResetIcon: true,
        id: "ggb-app",
        appletOnLoad: (api: any) => {
          if (!mounted) return;
          apiRef.current = api;
          setIsLoaded(true);

          // Load initial content
          if (configData.xml) {
            api.setXML(configData.xml);
          } else if (configData.commands && configData.commands.length > 0) {
            // Execute commands with error handling
            const errors: string[] = [];

            configData.commands.forEach((cmd: string) => {
              try {
                const result = api.evalCommand(cmd);
                // GeoGebra returns false for failed commands
                if (result === false) {
                  errors.push(`Failed: ${cmd}`);
                }
              } catch (error) {
                errors.push(
                  `Error in "${cmd}": ${error instanceof Error ? error.message : String(error)}`,
                );
              }
            });

            // Report errors if any
            if (errors.length > 0) {
              console.error("GeoGebra command errors:", errors);
              onErrorRef.current?.(errors.join("\n"));
            }
          }

          // Notify parent using ref to avoid dependency issues
          onInitRef.current?.(api);
        },
      };

      applet = new (window as any).GGBApplet(params, true);
      applet.inject(containerRef.current);
    }

    initGeoGebra();

    return () => {
      mounted = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      apiRef.current = null;
      setIsLoaded(false);
    };
  }, [config, width, height]);

  if (!config) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 ${className}`}
        style={{ width, height }}
      >
        <p className="text-gray-500">
          Enter a prompt to generate a GeoGebra visualization
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="ggb-app"
      className={className}
      style={{ width, height }}
    />
  );
}

interface GeoGebraControlsProps {
  api: any;
  parameters: GeoGebraParameter[];
}

export function GeoGebraControls({ api, parameters }: GeoGebraControlsProps) {
  const [values, setValues] = useState<Record<string, number | boolean>>(() => {
    const initial: Record<string, number | boolean> = {};
    parameters.forEach((p) => {
      initial[p.name] = p.default !== undefined ? p.default : 0;
    });
    return initial;
  });

  useEffect(() => {
    if (!api) return;

    // Update GeoGebra when values change
    Object.entries(values).forEach(([name, value]) => {
      if (typeof value === "number") {
        api.setValue(name, value);
      } else if (typeof value === "boolean") {
        api.setValue(name, value ? 1 : 0);
      }
    });
  }, [values, api]);

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      {parameters.map((param) => (
        <div key={param.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="font-medium text-sm">{param.label}</p>
            {param.type === "slider" &&
              typeof values[param.name] === "number" && (
                <span className="text-xs text-gray-600 font-mono">
                  {(values[param.name] as number).toFixed(2)}
                </span>
              )}
          </div>
          {param.type === "slider" &&
            typeof values[param.name] === "number" && (
              <input
                type="range"
                min={param.min ?? 0}
                max={param.max ?? 10}
                step={param.step ?? 0.1}
                value={values[param.name] as number}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [param.name]: Number.parseFloat(e.target.value),
                  }))
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            )}
          {param.description && (
            <p className="text-xs text-gray-500">{param.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
