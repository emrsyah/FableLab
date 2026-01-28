# GeoGebra Integration Guide for Next.js

Based on research of GeoGebra documentation and integration patterns, here's a comprehensive guide for creating AI-generated GeoGebra content in Next.js.

---

## 1. GeoGebra File Format Overview

**`.ggb` files are renamed `.zip` archives** containing:

```
your-file.ggb (rename to .zip and extract)
├── geogebra.xml          # Main construction data (XML format)
├── geogebra_thumbnail.png # Preview image
├── geogebra.js           # JavaScript definitions (optional)
└── images/               # Embedded images (if any)
```

**Key file**: `geogebra.xml` - All mathematical constructions (functions, points, geometry) are defined here in XML.

**XML Schema**: Defined at http://geogebra.org/ggb.xsd

---

## 2. Two Approaches for AI-Generated Content

### Approach A: **Live API Commands** (Recommended for dynamic parameters)
Use the GeoGebra JavaScript API to create/modify constructions in real-time.

**Pros**:
- Dynamic parameter updates without reloading
- Interactive sliders work automatically
- Clean separation between React state and GeoGebra visualization

**Cons**:
- Requires managing the API lifecycle
- Initial setup complexity

### Approach B: **Generate .ggb Files**
Generate XML programmatically, zip it as `.ggb`, and load it.

**Pros**:
- Portable files
- Can be saved/shared

**Cons**:
- Regenerating entire file for small changes
- More complex setup

---

## 3. Recommended Implementation (Approach A)

### Step 3.1: Set Up GeoGebra in Next.js

**Install dependencies**:
```bash
npm install @types/geojson
```

**Create a reusable GeoGebra component**:

```tsx
// components/GeoGebraApplet.tsx
"use client";

import { useEffect, useRef } from 'react';

interface GeoGebraAppletProps {
  appName?: 'graphing' | 'geometry' | '3d' | 'classic';
  width?: number;
  height?: number;
  showToolBar?: boolean;
  showAlgebraInput?: boolean;
  showMenuBar?: boolean;
  onReady?: (api: any) => void;
}

export default function GeoGebraApplet({
  appName = 'graphing',
  width = 800,
  height = 600,
  showToolBar = true,
  showAlgebraInput = true,
  showMenuBar = true,
  onReady,
}: GeoGebraAppletProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appletRef = useRef<any>(null);

  useEffect(() => {
    // Load GeoGebra script
    const script = document.createElement('script');
    script.src = 'https://www.geogebra.org/apps/deployggb.js';
    script.async = true;

    script.onload = () => {
      // @ts-ignore
      const GGBApplet = window.GGBApplet;

      const params = {
        appName,
        width,
        height,
        showToolBar,
        showAlgebraInput,
        showMenuBar,
        appletOnLoad: (api: any) => {
          appletRef.current = api;
          onReady?.(api);
        },
      };

      appletRef.current = new GGBApplet(params, true);

      if (containerRef.current) {
        appletRef.current.inject(containerRef.current);
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (appletRef.current) {
        // @ts-ignore
        appletRef.current.remove();
      }
    };
  }, [appName, width, height, showToolBar, showAlgebraInput, showMenuBar, onReady]);

  return <div ref={containerRef} id="ggb-element" />;
}
```

---

### Step 3.2: Create Dynamic Wave Function Example

```tsx
// app/wave-experiment/page.tsx
"use client";

import { useState, useRef } from 'react';
import GeoGebraApplet from '@/components/GeoGebraApplet';

export default function WaveExperiment() {
  const [amplitude, setAmplitude] = useState(1);
  const [frequency, setFrequency] = useState(1);
  const [phase, setPhase] = useState(0);
  const apiRef = useRef<any>(null);

  const handleGeoGebraReady = (api: any) => {
    apiRef.current = api;
    updateWaveFunction();
  };

  const updateWaveFunction = () => {
    if (!apiRef.current) return;

    const api = apiRef.current;

    // Clear previous function
    if (api.exists('f')) {
      api.deleteObject('f');
    }

    // Create wave function: f(x) = amplitude * sin(frequency * x + phase)
    api.evalCommand(`f(x) = ${amplitude} * sin(${frequency} * x + ${phase})`);

    // Set color
    api.evalCommand('SetColor(f, 0, 0, 255)');

    // Show formula
    api.evalCommand('SetLineThickness(f, 3)');
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Wave Function Experiment</h1>

      {/* Controls */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg space-y-4">
        <div>
          <label className="block font-medium mb-2">
            Amplitude: {amplitude}
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={amplitude}
            onChange={(e) => setAmplitude(parseFloat(e.target.value))}
            onInput={updateWaveFunction}
            className="w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            Frequency: {frequency}
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={frequency}
            onChange={(e) => setFrequency(parseFloat(e.target.value))}
            onInput={updateWaveFunction}
            className="w-full"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">
            Phase: {phase} rad
          </label>
          <input
            type="range"
            min="0"
            max="6.28"
            step="0.1"
            value={phase}
            onChange={(e) => setPhase(parseFloat(e.target.value))}
            onInput={updateWaveFunction}
            className="w-full"
          />
        </div>
      </div>

      {/* GeoGebra Applet */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <GeoGebraApplet
          appName="graphing"
          width={800}
          height={500}
          onReady={handleGeoGebraReady}
        />
      </div>
    </div>
  );
}
```

---

### Step 3.3: Advanced Example - Multiple Functions

```tsx
// app/multi-function/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import GeoGebraApplet from '@/components/GeoGebraApplet';

interface FunctionDef {
  name: string;
  formula: string;
  color: string;
}

export default function MultiFunctionExperiment() {
  const [functions, setFunctions] = useState<FunctionDef[]>([
    { name: 'f', formula: 'sin(x)', color: '255,0,0' },    // Red
    { name: 'g', formula: 'cos(x)', color: '0,0,255' },    // Blue
    { name: 'h', formula: 'x^2', color: '0,128,0' },      // Green
  ]);

  const apiRef = useRef<any>(null);

  const handleGeoGebraReady = (api: any) => {
    apiRef.current = api;
    renderAllFunctions(api);
  };

  const renderAllFunctions = (api: any) => {
    functions.forEach(func => {
      if (api.exists(func.name)) {
        api.deleteObject(func.name);
      }
      api.evalCommand(`${func.name}(x) = ${func.formula}`);
      api.evalCommand(`SetColor(${func.name}, ${func.color})`);
    });
  };

  const updateFunction = (index: number, formula: string) => {
    setFunctions(prev => {
      const updated = [...prev];
      updated[index].formula = formula;
      return updated;
    });
  };

  // Update GeoGebra when functions change
  useEffect(() => {
    if (apiRef.current) {
      renderAllFunctions(apiRef.current);
    }
  }, [functions]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Multi-Function Experiment</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {functions.map((func, index) => (
          <div key={func.name} className="p-4 bg-gray-100 rounded-lg">
            <h3 className="font-bold mb-2" style={{ color: `rgb(${func.color})` }}>
              Function {func.name}
            </h3>
            <input
              type="text"
              value={func.formula}
              onChange={(e) => updateFunction(index, e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="e.g., sin(x)"
            />
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <GeoGebraApplet
          appName="graphing"
          width={900}
          height={500}
          onReady={handleGeoGebraReady}
        />
      </div>
    </div>
  );
}
```

---

## 4. Key GeoGebra API Methods

### Creating Objects
```javascript
api.evalCommand('f(x) = sin(x)');           // Create function
api.evalCommand('A = (1,2)');               // Create point
api.evalCommand('l = Line((0,0), (1,1)');   // Create line
api.evalCommand('Circle(A, 3)');             // Create circle
```

### Modifying Objects
```javascript
api.setValue('a', 5);                        // Set number value
api.setCoords('A', 3, 4);                   // Set point coordinates
api.setColor('f', 255, 0, 0);                // Set color (RGB)
api.setVisible('f', false);                  // Hide object
api.setLineThickness('f', 3);               // Set line thickness
```

### Getting Values
```javascript
const value = api.getValue('a');             // Get number value
const x = api.getXcoord('A');                // Get x-coordinate
const formula = api.getValueString('f');      // Get formula as string
const allObjects = api.getAllObjectNames(); // Get all object names
```

### Event Listeners
```javascript
api.registerUpdateListener((objName) => {
  console.log('Object updated:', objName);
});

api.registerClickListener((objName) => {
  console.log('Object clicked:', objName);
});
```

---

## 5. Common Mathematical Patterns

### Quadratic Function with Parameters
```javascript
api.evalCommand('a = Slider(0, 5, 1)');
api.evalCommand('b = Slider(-5, 5, 1)');
api.evalCommand('c = Slider(-5, 5, 1)');
api.evalCommand('f(x) = a * x^2 + b * x + c');
```

### Parametric Curve
```javascript
api.evalCommand('Curve((cos(t), sin(t)), t, 0, 2π)');
```

### Polar Function
```javascript
api.evalCommand('f(r) = r^2');
api.evalCommand('Polar(f, 0, 5)');
```

### 3D Surface
```javascript
api.evalCommand('Surface(x^2 - y^2, x, -3, 3, y, -3, 3)');
```

---

## 6. Alternative: Using react-geogebra Package

```bash
npm install react-geogebra
```

```tsx
import GeoGebra from 'react-geogebra';

export default function MyComponent() {
  return (
    <GeoGebra
      appName="graphing"
      width={800}
      height={600}
      onReady={(api) => {
        api.evalCommand('f(x) = sin(x)');
      }}
    />
  );
}
```

---

## 7. Generating .ggb Files Programmatically (Approach B)

If you need to generate downloadable `.ggb` files:

```typescript
import JSZip from 'jszip';

async function generateGGBFile(constructions: any[]): Promise<Blob> {
  const zip = new JSZip();

  // Create geogebra.xml structure
  const xml = generateGeoGebraXML(constructions);
  zip.file('geogebra.xml', xml);

  // Generate thumbnail (optional)
  const thumbnail = await generateThumbnail();
  zip.file('geogebra_thumbnail.png', thumbnail);

  // Generate blob
  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

function generateGeoGebraXML(constructions: any[]): string {
  // Build XML based on GeoGebra schema
  // This is complex - refer to http://geogebra.org/ggb.xsd
  return `<?xml version="1.0" encoding="utf-8"?>
<geogebra format="5.0" version="5.0.0.0">
  <construction>
    ${constructions.map(c => generateXMLElement(c)).join('\n')}
  </construction>
</geogebra>`;
}
```

---

## 8. Best Practices

1. **Use `"use client"`** - GeoGebra requires client-side rendering
2. **Wait for appletOnLoad** - Only use the API after it's ready
3. **Use English command names** - Even with localized UI, commands must be in English
4. **Clean up on unmount** - Remove applet to prevent memory leaks
5. **Check object existence** - Use `api.exists()` before operations
6. **Batch operations** - For multiple updates, disable repainting:
   ```javascript
   api.setRepaintingActive(false);
   // ... multiple operations
   api.setRepaintingActive(true);
   ```

---

## 9. Example: Complete AI-Generated Experiment

Here's a complete example showing how to dynamically generate experiments:

```tsx
// app/ai-generated/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import GeoGebraApplet from '@/components/GeoGebraApplet';

interface Experiment {
  title: string;
  description: string;
  functions: {
    formula: string;
    color: string;
    label: string;
  }[];
  sliders?: {
    name: string;
    min: number;
    max: number;
    initial: number;
  }[];
}

const experiments: Record<string, Experiment> = {
  'wave': {
    title: 'Wave Function',
    description: 'Explore amplitude, frequency, and phase of sine waves',
    functions: [
      { formula: 'a * sin(b * x + c)', color: '0,0,255', label: 'f(x)' },
    ],
    sliders: [
      { name: 'a', min: 0.1, max: 3, initial: 1 },
      { name: 'b', min: 0.1, max: 3, initial: 1 },
      { name: 'c', min: 0, max: 6.28, initial: 0 },
    ],
  },
  'quadratic': {
    title: 'Quadratic Functions',
    description: 'Explore how a, b, and c affect parabolas',
    functions: [
      { formula: 'a * x^2 + b * x + c', color: '255,0,0', label: 'f(x)' },
    ],
    sliders: [
      { name: 'a', min: -2, max: 2, initial: 1 },
      { name: 'b', min: -5, max: 5, initial: 0 },
      { name: 'c', min: -5, max: 5, initial: 0 },
    ],
  },
  'trigonometry': {
    title: 'Trigonometric Functions',
    description: 'Compare sin, cos, and tan',
    functions: [
      { formula: 'sin(x)', color: '255,0,0', label: 'sin(x)' },
      { formula: 'cos(x)', color: '0,0,255', label: 'cos(x)' },
      { formula: 'tan(x)', color: '0,128,0', label: 'tan(x)' },
    ],
  },
};

export default function AIGeneratedExperiment() {
  const [selectedExp, setSelectedExp] = useState('wave');
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({});
  const apiRef = useRef<any>(null);

  const experiment = experiments[selectedExp];

  useEffect(() => {
    // Initialize slider values
    const initialValues: Record<string, number> = {};
    experiment.sliders?.forEach(slider => {
      initialValues[slider.name] = slider.initial;
    });
    setSliderValues(initialValues);
  }, [selectedExp]);

  useEffect(() => {
    if (!apiRef.current) return;

    const api = apiRef.current;

    // Create sliders
    experiment.sliders?.forEach(slider => {
      if (!api.exists(slider.name)) {
        api.evalCommand(
          `${slider.name} = Slider(${slider.min}, ${slider.max}, ${sliderValues[slider.name]})`
        );
      }
    });

    // Create functions
    experiment.functions.forEach(func => {
      if (api.exists(func.label)) {
        api.deleteObject(func.label);
      }
      api.evalCommand(`${func.label}(x) = ${func.formula}`);
      api.evalCommand(`SetColor(${func.label}, ${func.color})`);
    });
  }, [selectedExp, sliderValues, experiment]);

  const handleSliderChange = (name: string, value: number) => {
    setSliderValues(prev => ({ ...prev, [name]: value }));

    if (apiRef.current) {
      apiRef.current.setValue(name, value);
    }
  };

  return (
    <div className="min-h-screen p-8">
      {/* Experiment Selector */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">AI-Generated Math Experiments</h1>
        <div className="flex gap-2">
          {Object.keys(experiments).map(key => (
            <button
              key={key}
              onClick={() => setSelectedExp(key)}
              className={`px-4 py-2 rounded ${
                selectedExp === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {experiments[key].title}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-4">{experiment.description}</p>

      {/* Sliders */}
      {experiment.sliders && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg space-y-4">
          {experiment.sliders.map(slider => (
            <div key={slider.name}>
              <label className="block font-medium mb-2">
                {slider.name}: {sliderValues[slider.name]?.toFixed(2)}
              </label>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step="0.01"
                value={sliderValues[slider.name] ?? slider.initial}
                onChange={(e) => handleSliderChange(slider.name, parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          ))}
        </div>
      )}

      {/* GeoGebra Applet */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <GeoGebraApplet
          appName="graphing"
          width={900}
          height={500}
          onReady={(api) => { apiRef.current = api; }}
        />
      </div>
    </div>
  );
}
```

---

## Summary

**For your use case** (AI-generated experiments with adjustable parameters):

1. ✅ Use **Approach A** (Live API Commands) for dynamic updates
2. ✅ Create reusable `GeoGebraApplet` component
3. ✅ Use `evalCommand()` to create/modify functions
4. ✅ Connect React state (sliders/inputs) to GeoGebra via `setValue()` and `evalCommand()`
5. ✅ Use English command names in `evalCommand()`
6. ✅ Wait for `appletOnLoad` before using the API

This approach gives you flexibility to generate any mathematical experiment dynamically while leveraging GeoGebra's powerful visualization capabilities.

---

## Resources

- [GeoGebra Apps API Documentation](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/)
- [GeoGebra Embedding Guide](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_Embedding/)
- [GeoGebra File Format](https://geogebra.github.io/docs/reference/en/File_Format/)
- [GeoGebra XML Reference](https://geogebra.github.io/docs/reference/en/XML/)
- [react-geogebra Package](https://www.npmjs.com/package/react-geogebra)
