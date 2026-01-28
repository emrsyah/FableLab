# GeoGebra Integration for Next.js - Research Report

## Executive Summary

This research covers GeoGebra integration strategies for building AI-generated interactive mathematical visualizations in Next.js 16/React 19/TypeScript applications. It includes embedding methods, programmatic content generation, API capabilities, and implementation patterns for dynamic, user-interactive simulations.

---

## 1. Embedding GeoGebra in Next.js

### 1.1 Basic Script-Based Embedding

**Source**: [GeoGebra Apps Embedding](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_Embedding/)

The simplest method uses the official `deployggb.js` script:

```tsx
'use client'

import { useEffect, useRef } from 'react'

export function GeoGebraComponent() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load GeoGebra script
    const script = document.createElement('script')
    script.src = 'https://www.geogebra.org/apps/deployggb.js'
    script.async = true
    document.head.appendChild(script)

    script.onload = () => {
      const params = {
        appName: 'graphing',  // App type: 'graphing', 'geometry', '3d', 'classic', 'scientific', 'notes'
        width: 800,
        height: 600,
        showToolBar: true,
        showAlgebraInput: true,
        showMenuBar: false,
        appletOnLoad: (api: any) => {
          // API available here for programmatic control
          console.log('GeoGebra API ready:', api)
        }
      }

      const applet = new (window as any).GGBApplet(params, true)
      if (containerRef.current) {
        applet.inject('ggb-element')
      }
    }
  }, [])

  return <div id="ggb-element" ref={containerRef} />
}
```

### 1.2 Using React Component Library (NOT REALLY CUSTOMIZABLE AND NOT BEING MAINTAINED, DONT USE)

**Source**: [react-geogebra npm](https://www.npmjs.com/package/react-geogebra)

A pre-built React wrapper is available:

```bash
npm install react-geogebra
```

```tsx
import Geogebra from 'react-geogebra'

function App() {
  return (
    <Geogebra
      appName="graphing"
      width={800}
      height={600}
      showToolBar={true}
      showAlgebraInput={true}
      showMenuBar={false}
      id="ggb-app"
    />
  )
}
```

### 1.3 ES6 Module Approach (Recommended for Next.js)

**Source**: [GeoGebra Apps API - ES6 Modules](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/#_obtaining_the_api_object_as_a_module_the_es6_way)

For modern Next.js applications, use ES6 modules:

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

export function GeoGebraES6Component() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<any>(null)

  useEffect(() => {
    let mounted = true

    async function loadGeoGebra() {
      const { mathApps } = await import('https://www.geogebra.org/apps/web3d/web3d.nocache.mjs')

      if (mounted && containerRef.current) {
        const app = mathApps.create({
          appName: 'graphing',
          width: 800,
          height: 600,
          showAlgebraInput: true
        })

        app.inject(containerRef.current)
        const ggbApi = await app.getAPI()
        setApi(ggbApi)
      }
    }

    loadGeoGebra()

    return () => {
      mounted = false
    }
  }, [])

  return <div ref={containerRef} id="ggb-element" />
}
```

---

## 2. Programmatic Content Generation

### 2.1 JavaScript API Commands

**Source**: [GeoGebra Apps API - Creating Objects](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/#_creating_objects)

The GeoGebra API provides methods to programmatically create and manipulate objects:

```typescript
interface GeoGebraAPI {
  evalCommand(cmdString: string): boolean  // Execute a GeoGebra command
  evalLaTex(input: string): boolean       // Render LaTeX
  evalCommandGetLabels(cmdString: string): string  // Get object labels
  evalCommandCAS(string: string): string // Execute CAS command
  setXML(xmlString: string): void         // Load full construction from XML
  getXML(): string                        // Export current construction as XML
  getFileJSON(): any                      // Export as JSON
  setFileJSON(content: any): void         // Load from JSON
}

// Example: Programmatically create objects
function createVisualization(api: GeoGebraAPI) {
  // Create a function
  api.evalCommand('f(x) = sin(x)')

  // Create points
  api.evalCommand('A = (0, 0)')
  api.evalCommand('B = (2, 3)')

  // Create a line
  api.evalCommand('l = Line(A, B)')

  // Create a circle
  api.evalCommand('c = Circle(A, 3)')

  // Create a 3D surface
  api.evalCommand('Surface((2 + cos(u))*cos(v), (2 + cos(u))*sin(v), sin(u), u, 0, 2*pi, v, 0, 2*pi)')
}
```

### 2.2 XML-Based Construction

**Source**: [XML Tags Reference](https://geogebra.github.io/docs/reference/en/XML_tags_in_geogebra_xml/)

For complete, self-contained visualizations, use GeoGebra XML:

```typescript
// Generate complete construction from XML
const constructionXML = `
<geogebra format="5.0" version="6.0.945.0">
  <construction>
    <element type="function" label="f">
      <coords x="0" y="0" z="0"/>
      <value val="sin(x)"/>
    </element>
    <element type="point" label="A">
      <coords x="0" y="0" z="0"/>
    </element>
    <element type="point" label="B">
      <coords x="2" y="3" z="0"/>
    </element>
  </construction>
</geogebra>
`

api.setXML(constructionXML)
```

### 2.3 JSON Format

**Source**: [GeoGebra Apps API - File Format](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/#_geogebras_file_format)

JSON format includes metadata and images:

```typescript
// Save construction as JSON
const constructionJSON = api.getFileJSON()

// Load construction from JSON
api.setFileJSON(constructionJSON)

// For AI generation, generate JSON programmatically
const generatedJSON = {
  appName: 'graphing',
  xml: '<geogebra>...</geogebra>',
  images: {}
}
```

---

## 3. GeoGebra Capabilities & Graphing Types

### 3.1 Available App Types

**Source**: [GeoGebra App Parameters](https://geogebra.github.io/docs/reference/en/GeoGebra_App_Parameters/)

| App Name | Description | Use Case |
|-----------|-------------|-----------|
| `graphing` | Graphing Calculator | Functions, calculus, algebra |
| `geometry` | Geometry Tools | 2D geometric constructions |
| `3d` | 3D Graphing Calculator | 3D surfaces, solids, vectors |
| `classic` | Classic App | Full-featured, all tools |
| `suite` | Calculator Suite | Multiple views, complete toolset |
| `evaluator` | Equation Editor | Math equation input/rendering |
| `scientific` | Scientific Calculator | Basic calculations, scientific functions |
| `notes` | GeoGebra Notes | Slides with interactive elements |

### 3.2 Command Categories by Type

**Source**: [Commands - GeoGebra Manual](https://geogebra.github.io/docs/manual/en/Commands/)

#### 3D Commands
- **Solids**: `Sphere`, `Cube`, `Cone`, `Cylinder`, `Pyramid`, `Tetrahedron`
- **Surfaces**: `Plane`, `Surface`, `Curve` (3D)
- **Transformations**: `Rotate`, `Translate` (3D)

#### Function & Calculus Commands
- **Functions**: `Function`, `Derivative`, `Integral`, `Limit`
- **Analysis**: `Tangent`, `Extremum`, `InflectionPoint`, `Slope`
- **Series**: `TaylorPolynomial`, `NDerivative`

#### Geometry Commands
- **Basic**: `Point`, `Line`, `Segment`, `Ray`, `Polygon`
- **Curves**: `Circle`, `Ellipse`, `Parabola`, `Hyperbola`
- **Relations**: `Intersect`, `Perpendicular`, `Angle`, `Distance`

#### CAS Commands (Computer Algebra System)
- **Equations**: `Solve`, `Factor`, `Expand`, `Simplify`
- **Calculus**: `Derivative`, `Integral`, `Limit`
- **Advanced**: `CSolve`, `CFactor`, `NIntegral`

#### Statistics & Probability
- **Statistics**: `Mean`, `Median`, `StandardDeviation`, `Variance`
- **Charts**: `BarChart`, `Histogram`, `BoxPlot`
- **Distributions**: `BinomialDist`, `NormalDist`, `Random`

#### Physics Simulations
- **Motion**: `Velocity`, `Acceleration`, `Path`
- **Forces**: `Force`, `Momentum`, `KineticEnergy`
- **Waves**: `Wave`, `Frequency`, `Amplitude`

---

## 4. GeoGebra Syntax & Format

### 4.1 Object Creation Syntax

**Source**: [Commands - Full List](https://geogebra.github.io/docs/manual/en/Commands/)

```typescript
// Points
'A = (0, 0)'              // 2D point
'A = (0, 0, 1)'          // 3D point
'A = Point(2, 3)'        // Alternative syntax

// Lines & Segments
'l = Line(A, B)'         // Line through two points
's = Segment(A, B)'      // Segment
'r = Ray(A, B)'          // Ray

// Circles
'c = Circle(A, 3)'       // Circle with center A, radius 3
'c = Circle(A, B)'       // Circle with center A, passing through B

// Functions
'f(x) = x^2'             // Quadratic
'f(x) = sin(x)'          // Trigonometric
'f(x) = e^x'             // Exponential
'f(x) = ln(x)'           // Logarithmic
'f(x) = sqrt(x)'         // Square root
'f(x) = abs(x)'          // Absolute value

// 3D Surfaces
'Surface((2+cos(u))*cos(v), (2+cos(u))*sin(v), sin(u), u, 0, 2*pi, v, 0, 2*pi)'
// Creates a torus

// Parametric curves
'Curve(cos(t), sin(t), t, 0, 2*pi)'

// Implicit curves
'ImplicitCurve(x^2 + y^2 = 1)'  // Circle

// Multiple functions
'f(x) = x^2'
'g(x) = sin(x)'
'h(x) = f(x) + g(x)'  // Combine functions
```

### 4.2 Animation Syntax

**Source**: [GeoGebra Apps API - Automatic Animation](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/#_automatic_animation)

```typescript
// Create animated parameter
'a = Slider(0, 10, 0.1)'  // min, max, step

// Animate object
api.setAnimating('a', true)
api.setAnimationSpeed('a', 0.5)
api.startAnimation()

// Use in construction
'f(x) = sin(x + a)'  // Wave shifts as 'a' changes

// Complex animation example
'a = Slider(0, 2*pi, 0.1)'
'PointA = (cos(a), sin(a))'  // Point moves in circle
```

### 4.3 Conditional Visibility

```typescript
// Boolean expressions for conditional objects
'b = 3 > 2'              // Evaluates to true

// Show/hide based on condition
'ShowObject(f, b)'       // Show f if b is true
'ShowObject(f, a > 5)'   // Show f when slider a > 5

// Checkboxes
'Checkbox = Checkbox("Show", true)'
'ShowObject(f, Checkbox)'

// Complex conditions
'condition = (a > 0) && (b < 10)'
'ShowObject(graph, condition)'
```

### 4.4 Advanced Syntax Examples

```typescript
// Piecewise functions
'f(x) = If(x < 0, x^2, sin(x))'  // Parabola for x<0, sine for x>=0

// Implicit equations
'ImplicitCurve(x^3 + y^3 = 1)'  // Folium of Descartes

// Differential equations
'SlopeField(dy/dx = x^2 + y^2)'

// Polar coordinates
'PolarCurve(1 + cos(theta), 0, 2*pi)'  // Cardioid

// Parametric surfaces
'Surface(u*cos(v), u*sin(v), v, u, 0, 3, v, 0, 2*pi)'  // Cone

// Sequences
'Sequence(i^2, i, 1, 10)'  // 1, 4, 9, 16, 25, 36, 49, 64, 81, 100
```

---

## 5. Interactive Parameters

### 5.1 Sliders

**Source**: [Common XML tags - slider](https://geogebra.github.io/docs/reference/en/Common_XML_tags_and_types/#_type_slider)

```typescript
// Create slider via command
'a = Slider(0, 10, 0.1)'      // min, max, step
'b = Slider(-5, 5, 0.5)'       // Negative range

// Create slider with fixed positions
'c = Slider(1, 5, 1)'          // Integer steps

// Use slider in expressions
'f(x) = a * x^2 + b * x + c'  // Dynamic quadratic
'y = a * sin(b * x + c)'      // Dynamic sine wave

// Animated sliders
'd = Slider(0, 10, 0.01)'
api.setAnimating('d', true)
```

### 5.2 Input Boxes & Buttons

```typescript
// Input box for user input
'Input = InputBox("Enter value", 0)'

// Button for actions
'Button = Button("Reset", SetCoords(A, 0, 0))'

// Access value from input
'SetValue(a, Input)'

// Multiple inputs
'xInput = InputBox("x coordinate", 0)'
'yInput = InputBox("y coordinate", 0)'
'SetCoords(Point, xInput, yInput)'
```

### 5.3 Dynamic Updates via API

**Source**: [GeoGebra Apps API - Setting State](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/#_setting_the_state_of_objects)

```typescript
interface GeoGebraAPI {
  // Update values
  setValue(objName: string, value: number): void
  setCoords(objName: string, x: number, y: number): void
  setTextValue(objName: string, value: string): void

  // Update appearance
  setColor(objName: string, r: number, g: number, b: number): void
  setVisible(objName: string, visible: boolean): void
  setPointSize(objName: string, size: number): void
  setLineThickness(objName: string, thickness: number): void
  setFilling(objName: string, filling: number): void  // 0-1 for opacity

  // Animation control
  setAnimating(objName: string, animate: boolean): void
  setAnimationSpeed(objName: string, speed: number): void
  startAnimation(): void
  stopAnimation(): void
}

// Example: React-controlled parameters
function updateParameters(api: GeoGebraAPI, a: number, b: number, c: number) {
  api.setValue('a', a)
  api.setValue('b', b)
  api.setValue('c', c)

  // Update function based on new parameters
  api.evalCommand('f(x) = ' + a + '*x^2 + ' + b + '*x + ' + c)
}
```

### 5.4 React Integration Example

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'

export function InteractiveGeoGebra({ api }: { api: any }) {
  const [amplitude, setAmplitude] = useState(1)
  const [frequency, setFrequency] = useState(1)

  useEffect(() => {
    if (!api) return

    // Create or update the function
    api.evalCommand(`f(x) = ${amplitude} * sin(${frequency} * x)`)
  }, [amplitude, frequency, api])

  return (
    <div className="space-y-4 p-4">
      <div>
        <label>Amplitude: {amplitude.toFixed(2)}</label>
        <Slider
          value={[amplitude]}
          onValueChange={([v]) => setAmplitude(v)}
          min={0.1}
          max={5}
          step={0.1}
        />
      </div>
      <div>
        <label>Frequency: {frequency.toFixed(2)}</label>
        <Slider
          value={[frequency]}
          onValueChange={([v]) => setFrequency(v)}
          min={0.1}
          max={5}
          step={0.1}
        />
      </div>
    </div>
  )
}
```

---

## 6. API Methods for Dynamic Control

### 6.1 Object Management

**Source**: [Creating Objects](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/#_creating_objects)

```typescript
// Create objects
api.evalCommand('A = (0, 0)')           // Returns true if successful
api.evalCommand('f(x) = sin(x)')
api.evalCommand('l = Line((0,0), (1,1))')

// Get object info
const exists = api.exists('A')           // Check if object exists
const type = api.getObjectType('A')     // Get type: "point", "line", etc.
const value = api.getValue('a')           // Get numeric value
const label = api.getValueString('f')    // Get string representation

// Delete objects
api.deleteObject('A')
```

### 6.2 Getting State

**Source**: [Getting State](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/#_getting_the_state_of_objects)

```typescript
// Get coordinates
const x = api.getXcoord('A')
const y = api.getYcoord('A')
const z = api.getZcoord('A')  // For 3D points

// Get values
const length = api.getValue('s')     // Length of segment s
const area = api.getValue('poly')    // Area of polygon

// Get all objects
const allObjects = api.getAllObjectNames()
const points = api.getAllObjectNames('point')
const functions = api.getAllObjectNames('function')

// Export state
const xml = api.getXML()              // Full construction XML
const xmlForObject = api.getXML('A')  // XML for specific object
const json = api.getFileJSON()        // JSON with XML and images
const base64 = api.getBase64()        // Base64-encoded .ggb file
```

### 6.3 Event Listeners

**Source**: [Event Listeners](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/#_event_listeners)

```typescript
// Listen for object updates
api.registerUpdateListener((objName: string) => {
  console.log('Updated:', objName)
  const newValue = api.getValue(objName)
  // React to changes
})

// Listen for specific object
api.registerObjectUpdateListener('A', () => {
  const x = api.getXcoord('A')
  const y = api.getYcoord('A')
  console.log('Point A moved to:', x, y)
})

// Listen for clicks
api.registerClickListener((objName: string) => {
  console.log('Clicked:', objName)
})

// Listen for additions
api.registerAddListener((objName: string) => {
  console.log('Created:', objName)
})

// Listen for deletions
api.registerRemoveListener((objName: string) => {
  console.log('Deleted:', objName)
})

// Generic client events
api.registerClientListener((event: any) => {
  console.log('Event:', event.type, event)
  // Events: setMode, select, deselect, dragEnd, etc.
})
```

### 6.4 State Persistence

**Source**: [Saving & Loading](https://geogebra.github.io/integration/example-api-save-state.html)

```typescript
// Save current state
function saveState(api: GeoGebraAPI) {
  const xml = api.getXML()
  const base64 = api.getBase64()
  const json = api.getFileJSON()

  // Store in database, localStorage, or file
  localStorage.setItem('geogebra-state', base64)
  return base64
}

// Load saved state
function loadState(api: GeoGebraAPI, base64Data: string) {
  api.setBase64(base64Data, () => {
    console.log('State loaded successfully')
  })
}

// Or use XML
function loadFromXML(api: GeoGebraAPI, xmlData: string) {
  api.setXML(xmlData)  // Clears and loads new construction
  // OR
  api.evalXML(xmlData)  // Adds to existing construction
}
```

---

## 7. AI-Generated GeoGebra Content Pattern

### 7.1 Prompt → XML/Command Generation

AI can generate GeoGebra visualizations from natural language prompts:

```typescript
// AI prompt to GeoGebra commands mapping
interface AIPromptToGeoGebra {
  prompt: string
  commands: string[]
  sliders: { name: string, min: number, max: number, default: number }[]
  interactive: boolean
  description: string
}

// Example AI-generated content
const aiGeneratedContent: AIPromptToGeoGebra = {
  prompt: "Show me a sine wave with adjustable amplitude and frequency",
  commands: [
    'A = (0, 0)',
    'B = (10, 0)',
    'a = Slider(0, 5, 0.1)',
    'a.SetValue(1)',
    'b = Slider(0, 5, 0.1)',
    'b.SetValue(1)',
    'f(x) = a * sin(b * x)'
  ],
  sliders: [
    { name: 'a', min: 0, max: 5, default: 1 },
    { name: 'b', min: 0, max: 5, default: 1 }
  ],
  interactive: true,
  description: "Interactive sine wave with amplitude (a) and frequency (b) controls"
}

// Apply to GeoGebra
function applyGeneratedContent(api: GeoGebraAPI, content: AIPromptToGeoGebra) {
  // Clear existing
  api.newConstruction()

  // Execute commands
  content.commands.forEach(cmd => api.evalCommand(cmd))

  // Set up view
  api.setCoordSystem(-5, 10, -5, 5)
}
```

### 7.2 Structuring AI Prompts for Generation

```typescript
// Prompt template for AI generation
const geogebraPromptTemplate = `
Generate a GeoGebra visualization for the following mathematical concept:
${userPrompt}

Requirements:
1. Use English command names only
2. Include interactive sliders for key parameters
3. Set appropriate coordinate system
4. Use clear object naming (A, B, C for points; f, g for functions)
5. Add annotations/text where helpful
6. Output format: JSON with commands array and description
7. Ensure the visualization is educational and engaging
8. Include a brief explanation of what the visualization shows

Output should be valid GeoGebra evalCommand() strings that can be executed sequentially.
`

// Example AI response structure
interface AIGeneratedGeoGebra {
  description: string
  commands: string[]
  parameters: {
    name: string
    type: 'slider' | 'checkbox' | 'input'
    range?: [number, number]
    default?: number | boolean
    label: string
  }[]
  appName: 'graphing' | 'geometry' | '3d' | 'classic'
  educationalNotes: string[]
}
```

### 7.3 Gemini Integration Example

```typescript
// Using Google Gemini with structured output
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'

async function generateGeoGebraVisualization(prompt: string) {
  const result = await generateObject({
    model: google('gemini-2.0-flash-exp'),
    schema: AIGeneratedGeoGebraSchema,
    prompt: `
${geogebraPromptTemplate}

User request: ${prompt}
    `
  })

  return result.object
}

// Schema for validation
const AIGeneratedGeoGebraSchema = {
  type: 'object',
  properties: {
    description: { type: 'string' },
    commands: { type: 'array', items: { type: 'string' } },
    parameters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['slider', 'checkbox', 'input'] },
          range: { type: 'array', items: { type: 'number' } },
          default: { type: 'number' },
          label: { type: 'string' }
        },
        required: ['name', 'type', 'label']
      }
    },
    appName: {
      type: 'string',
      enum: ['graphing', 'geometry', '3d', 'classic']
    },
    educationalNotes: { type: 'array', items: { type: 'string' } }
  },
  required: ['description', 'commands', 'appName']
}
```

---

## 8. Next.js Implementation Best Practices

### 8.1 Typed GeoGebra Widget Component

```typescript
// src/components/playground/GeoGebraWidget.tsx
'use client'

import { useEffect, useRef, useCallback } from 'react'

interface GeoGebraParams {
  appName?: 'graphing' | 'geometry' | '3d' | 'classic' | 'scientific' | 'notes'
  width?: number
  height?: number
  showToolBar?: boolean
  showAlgebraInput?: boolean
  showMenuBar?: boolean
  enableRightClick?: boolean
  showResetIcon?: boolean
  id?: string
}

interface GeoGebraWidgetProps extends GeoGebraParams {
  onInit?: (api: any) => void
  onUpdate?: (state: string) => void
  initialCommands?: string[]
  initialXML?: string
  className?: string
}

export function GeoGebraWidget({
  appName = 'graphing',
  width = 800,
  height = 600,
  showToolBar = true,
  showAlgebraInput = true,
  showMenuBar = false,
  enableRightClick = true,
  showResetIcon = false,
  id = 'ggb-app',
  onInit,
  onUpdate,
  initialCommands = [],
  initialXML,
  className = ''
}: GeoGebraWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<any>(null)

  const handleUpdate = useCallback(() => {
    if (apiRef.current && onUpdate) {
      const state = apiRef.current.getBase64()
      onUpdate(state)
    }
  }, [onUpdate])

  useEffect(() => {
    let mounted = true
    let applet: any = null

    async function init() {
      // Load script if not already loaded
      if (!(window as any).GGBApplet) {
        const script = document.createElement('script')
        script.src = 'https://www.geogebra.org/apps/deployggb.js'
        script.async = true
        document.head.appendChild(script)

        await new Promise(resolve => script.onload = resolve)
      }

      if (!mounted || !containerRef.current) return

      // Create applet
      const params = {
        appName,
        width,
        height,
        showToolBar,
        showAlgebraInput,
        showMenuBar,
        enableRightClick,
        showResetIcon,
        id,
        appletOnLoad: (api: any) => {
          if (!mounted) return
          apiRef.current = api

          // Register update listener
          api.registerUpdateListener(() => handleUpdate())

          // Load initial content
          if (initialXML) {
            api.setXML(initialXML)
          } else if (initialCommands.length > 0) {
            initialCommands.forEach(cmd => api.evalCommand(cmd))
          }

          // Notify parent
          onInit?.(api)
        }
      }

      applet = new (window as any).GGBApplet(params, true)
      applet.inject(containerRef.current)
    }

    init()

    return () => {
      mounted = false
      applet?.remove()
    }
  }, [appName, width, height, showToolBar, showAlgebraInput, showMenuBar, enableRightClick, showResetIcon, id, onInit, onUpdate, initialCommands, initialXML, handleUpdate])

  return <div ref={containerRef} id={id} className={className} style={{ width, height }} />
}
```

### 8.2 Server Component with Client Wrapper

```typescript
// src/app/(app)/playground/[id]/page.tsx (Server Component)
import { GeoGebraWidget } from '@/components/playground/GeoGebraWidget'
import { db } from '@/lib/db'
import { playgrounds } from '@/lib/db/schema'

export default async function PlaygroundPage({ params }: { params: { id: string } }) {
  // Fetch playground data from server
  const playground = await db.query.playgrounds.findFirst({
    where: eq(playgrounds.id, parseInt(params.id))
  })

  if (!playground) {
    return <div>Playground not found</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">{playground.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <p className="text-gray-600">{playground.description}</p>

          {/* Instructions, controls, etc. */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">Instructions</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {playground.instructions?.map((inst, i) => (
                <li key={i}>{inst}</li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <GeoGebraWidget
            appName={playground.appName as any}
            width={800}
            height={600}
            initialXML={playground.geogebraConfig?.xml}
            onInit={(api) => {
              console.log('GeoGebra API ready', api)
            }}
            onUpdate={(state) => {
              // Save progress to database
              saveProgress(playground.id, state)
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

### 8.3 Dynamic Parameter Control Component

```typescript
// src/components/playground/ParameterControls.tsx
'use client'

import { useState, useEffect } from 'react'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'

interface Parameter {
  name: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  description?: string
}

interface ParameterControlsProps {
  api: any
  parameters: Parameter[]
}

export function ParameterControls({ api, parameters }: ParameterControlsProps) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    parameters.forEach(p => {
      initial[p.name] = p.defaultValue
    })
    return initial
  })

  useEffect(() => {
    if (!api) return

    // Update GeoGebra when values change
    Object.entries(values).forEach(([name, value]) => {
      api.setValue(name, value)
    })
  }, [values, api])

  return (
    <div className="space-y-6">
      {parameters.map(param => (
        <div key={param.name} className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor={`param-${param.name}`} className="font-medium">
              {param.label}
            </Label>
            <span className="text-sm text-gray-600 font-mono">
              {values[param.name]?.toFixed(2)}
            </span>
          </div>
          <Slider
            id={`param-${param.name}`}
            value={[values[param.name]]}
            onValueChange={([v]) =>
              setValues(prev => ({ ...prev, [param.name]: v }))
            }
            min={param.min}
            max={param.max}
            step={param.step}
            className="w-full"
          />
          {param.description && (
            <p className="text-xs text-gray-500">{param.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}
```

### 8.4 Scene Component with Objectives

```typescript
// src/components/lesson/GeoGebraScene.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { GeoGebraWidget } from '@/components/playground/GeoGebraWidget'
import { ParameterControls } from '@/components/playground/ParameterControls'
import { CheckCircle2, Circle } from 'lucide-react'

interface Scene {
  id: string
  title: string
  description: string
  appName: 'graphing' | 'geometry' | '3d'
  initialCommands: string[]
  parameters: Parameter[]
  objectives: string[]
}

export function GeoGebraScene({ scene }: { scene: Scene }) {
  const [api, setApi] = useState<any>(null)
  const [completedObjectives, setCompletedObjectives] = useState<Set<number>>(new Set())
  const [state, setState] = useState<string | null>(null)

  const checkObjectives = useCallback(() => {
    if (!api) return

    const newCompleted = new Set<number>()

    scene.objectives.forEach((obj, index) => {
      const isComplete = checkObjective(api, obj)
      if (isComplete) newCompleted.add(index)
    })

    setCompletedObjectives(newCompleted)
  }, [api, scene.objectives])

  const allCompleted = completedObjectives.size === scene.objectives.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold mb-2">{scene.title}</h2>
          {allCompleted && (
            <span className="flex items-center gap-2 text-green-600 font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Completed!
            </span>
          )}
        </div>
        <p className="text-gray-600">{scene.description}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GeoGebra Canvas */}
        <div className="lg:col-span-2">
          <GeoGebraWidget
            appName={scene.appName}
            width={800}
            height={600}
            initialCommands={scene.initialCommands}
            onInit={(ggbApi) => {
              setApi(ggbApi)
              checkObjectives()
            }}
            onUpdate={(newState) => {
              setState(newState)
              checkObjectives()
            }}
          />
        </div>

        {/* Controls Panel */}
        <div className="space-y-4">
          {/* Parameters */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-4">Parameters</h3>
            {api && <ParameterControls api={api} parameters={scene.parameters} />}
          </div>

          {/* Objectives */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-3">Objectives</h3>
            <ul className="space-y-3">
              {scene.objectives.map((obj, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-0.5">
                    {completedObjectives.has(index) ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </span>
                  <span
                    className={
                      completedObjectives.has(index)
                        ? 'line-through text-gray-400'
                        : 'text-gray-700'
                    }
                  >
                    {obj}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function checkObjective(api: any, objective: string): boolean {
  // Custom logic based on objective type
  // Example: Check if point A is at specific coordinates
  if (objective.includes('move point A to (3, 4)')) {
    const x = api.getXcoord('A')
    const y = api.getYcoord('A')
    return Math.abs(x - 3) < 0.1 && Math.abs(y - 4) < 0.1
  }
  return false
}
```

---

## 9. Database Integration

### 9.1 Database Schema for GeoGebra Content

```typescript
// src/lib/db/schema/geogebra.ts
import { pgTable, serial, text, jsonb, timestamp, boolean } from 'drizzle-orm/pg-core'
import { lessons } from './lessons'

export const geogebraConstructions = pgTable('geogebra_constructions', {
  id: serial('id').primaryKey(),
  lessonId: serial('lesson_id').references('lessons.id'),

  // Construction data
  appName: text('app_name').notNull(), // 'graphing', 'geometry', '3d', etc.
  xml: text('xml'), // Full XML construction
  base64: text('base64'), // Base64-encoded .ggb file
  json: jsonb('json'), // JSON with metadata

  // AI-generated metadata
  commands: text('commands').array(), // Array of evalCommand strings
  description: text('description'),
  parameters: jsonb('parameters'), // {name, type, range, default, label}[]

  // Versioning
  version: serial('version').notNull().default(1),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const userGeogebraProgress = pgTable('user_geogebra_progress', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  lessonId: serial('lesson_id').notNull().references('lessons.id'),
  sceneNumber: serial('scene_number').notNull(),

  // Saved state
  geogebraState: text('geogebra_state'), // Base64 state
  geogebraXML: text('geogebra_xml'), // Optional full XML

  // Objectives tracking
  completedObjectives: jsonb('completed_objectives'), // Set<number>

  // Completion status
  completedAt: timestamp('completed_at'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const playgrounds = pgTable('playgrounds', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),

  // Content
  title: text('title').notNull(),
  description: text('description'),
  instructions: text('instructions').array(),

  // GeoGebra configuration
  appName: text('app_name').notNull(),
  geogebraConfig: jsonb('geogebra_config').notNull(), // {xml, commands, parameters}

  // Visibility
  isPublic: boolean('is_public').notNull().default(false),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})
```

### 9.2 tRPC Router for GeoGebra Operations

```typescript
// src/lib/server/routers/geogebra.ts
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { router, protectedProcedure } from '../trpc'
import { geogebraConstructions, userGeogebraProgress, playgrounds } from '@/lib/db/schema'

export const geogebraRouter = router({
  // Save GeoGebra state
  saveProgress: protectedProcedure
    .input(z.object({
      lessonId: z.number(),
      sceneNumber: z.number(),
      geogebraState: z.string(), // Base64 state
      geogebraXML: z.string().optional(), // Optional full XML
      completedObjectives: z.array(z.number()).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx

      await db.insert(userGeogebraProgress).values({
        userId: session.user.id,
        lessonId: input.lessonId,
        sceneNumber: input.sceneNumber,
        geogebraState: input.geogebraState,
        geogebraXML: input.geogebraXML,
        completedObjectives: input.completedObjectives || [],
        completedAt: new Date()
      }).onConflictDoUpdate({
        target: [userGeogebraProgress.userId, userGeogebraProgress.lessonId, userGeogebraProgress.sceneNumber],
        set: {
          geogebraState: input.geogebraState,
          geogebraXML: input.geogebraXML,
          completedObjectives: input.completedObjectives || [],
          updatedAt: new Date()
        }
      })

      return { success: true }
    }),

  // Load saved progress
  loadProgress: protectedProcedure
    .input(z.object({
      lessonId: z.number(),
      sceneNumber: z.number()
    }))
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx

      const progress = await db.query.userGeogebraProgress.findFirst({
        where: and(
          eq(userGeogebraProgress.userId, session.user.id),
          eq(userGeogebraProgress.lessonId, input.lessonId),
          eq(userGeogebraProgress.sceneNumber, input.sceneNumber)
        )
      })

      return progress
    }),

  // Create playground
  createPlayground: protectedProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      description: z.string(),
      instructions: z.array(z.string()),
      appName: z.enum(['graphing', 'geometry', '3d', 'classic']),
      geogebraConfig: z.object({
        xml: z.string().optional(),
        commands: z.array(z.string()),
        parameters: z.array(z.object({
          name: z.string(),
          type: z.enum(['slider', 'checkbox', 'input']),
          range: z.tuple([z.number(), z.number()]).optional(),
          default: z.number().optional(),
          label: z.string()
        }))
      }),
      isPublic: z.boolean().default(false)
    }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx

      const [playground] = await db.insert(playgrounds).values({
        userId: session.user.id,
        ...input
      }).returning()

      return playground
    }),

  // Get playground
  getPlayground: protectedProcedure
    .input(z.object({
      id: z.number()
    }))
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx

      const playground = await db.query.playgrounds.findFirst({
        where: eq(playgrounds.id, input.id)
      })

      // Check access: owner or public
      if (!playground || (playground.userId !== session.user.id && !playground.isPublic)) {
        throw new Error('Playground not found or access denied')
      }

      return playground
    })
})
```

---

## 10. Complete Implementation Example

### 10.1 AI-Generated Lesson with GeoGebra

```typescript
// src/lib/ai/gemini/generate-lesson.ts
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'

interface GenerateLessonRequest {
  prompt: string
  targetAge: 'elementary' | 'middle' | 'high'
  complexity: 'basic' | 'intermediate' | 'advanced'
}

export async function generateLessonWithGeoGebra({
  prompt,
  targetAge,
  complexity
}: GenerateLessonRequest) {
  const lesson = await generateObject({
    model: google('gemini-2.0-flash-exp'),
    schema: lessonSchema,
    prompt: `
Generate an interactive STEM lesson about: "${prompt}"

Target Age: ${targetAge}
Complexity: ${complexity}

Requirements:
1. Create 4-6 scenes with progressive difficulty
2. Each scene should have a GeoGebra interactive visualization
3. Include clear learning objectives for each scene
4. Make it engaging and educational
5. Use age-appropriate language
6. Include GeoGebra commands for each scene
7. Add interactive parameters where relevant

Output format should match the schema.
    `
  })

  return lesson.object
}

const lessonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    targetAge: { type: 'string', enum: ['elementary', 'middle', 'high'] },
    complexity: { type: 'string', enum: ['basic', 'intermediate', 'advanced'] },
    estimatedDuration: { type: 'string' },
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          learningObjectives: { type: 'array', items: { type: 'string' } },
          geogebraConfig: {
            type: 'object',
            properties: {
              appName: {
                type: 'string',
                enum: ['graphing', 'geometry', '3d', 'classic']
              },
              commands: {
                type: 'array',
                items: { type: 'string' }
              },
              parameters: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string', enum: ['slider', 'checkbox', 'input'] },
                    range: { type: 'array', items: { type: 'number' } },
                    default: { type: 'number' },
                    label: { type: 'string' },
                    description: { type: 'string' }
                  },
                  required: ['name', 'type', 'label']
                }
              },
              objectives: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['appName', 'commands']
          }
        },
        required: ['title', 'description', 'learningObjectives', 'geogebraConfig']
      }
    }
  },
  required: ['title', 'description', 'targetAge', 'complexity', 'scenes']
}
```

### 10.2 Lesson Page with Scene Navigation

```typescript
// src/app/(app)/lesson/[id]/page.tsx
import { GeoGebraScene } from '@/components/lesson/GeoGebraScene'
import { getLessonWithProgress } from '@/lib/db/queries'

export default async function LessonPage({ params }: { params: { id: string } }) {
  const lesson = await getLessonWithProgress(params.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Lesson Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{lesson.title}</h1>
          <p className="text-gray-600 mb-4">{lesson.description}</p>

          <div className="flex items-center gap-4 text-sm">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {lesson.targetAge}
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              {lesson.complexity}
            </span>
            <span className="text-gray-500">
              {lesson.estimatedDuration}
            </span>
          </div>
        </div>

        {/* Scene Navigation */}
        <SceneNavigation
          lessonId={lesson.id}
          scenes={lesson.scenes}
          currentScene={lesson.currentScene}
        />

        {/* Current Scene */}
        <div className="mt-6">
          <GeoGebraScene scene={lesson.scenes[lesson.currentScene]} />
        </div>
      </div>
    </div>
  )
}
```

---

## 11. Recommended Implementation Strategy

### Phase 1: Basic Integration (Week 1)
**Goal**: Get GeoGebra embedding working in the app

1. Install dependencies:
   ```bash
   bun add react-geogebra @types/geojson
   ```

2. Create `GeoGebraWidget` component
3. Implement static visualization loading
4. Add basic parameter sliders
5. Set up event listeners
6. Create test page to verify functionality

### Phase 2: AI Generation (Week 2)
**Goal**: Generate GeoGebra content via AI

1. Design prompt template for Gemini
2. Create command generation logic
3. Implement parameter extraction
4. Add XML generation capability
5. Test with various math concepts
6. Validate generated content

### Phase 3: Interactive Features (Week 3)
**Goal**: Build interactive learning experiences

1. Add objective checking system
2. Implement progress saving/loading
3. Create parameter controls UI
4. Add animation support
5. Build scene navigation
6. Implement completion tracking

### Phase 4: Polish & Optimization (Week 4)
**Goal**: Production-ready experience

1. Add loading states and error handling
2. Optimize performance (lazy loading, code splitting)
3. Add accessibility features (keyboard navigation, ARIA labels)
4. Implement responsive design
5. Add analytics tracking
6. Comprehensive testing

---

## 12. Key Resources

### Official Documentation
- **Integration Guide**: [GeoGebra Integration](https://geogebra.github.io/integration/)
- **API Reference**: [GeoGebra Apps API](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/)
- **App Parameters**: [App Parameters](https://geogebra.github.io/docs/reference/en/GeoGebra_App_Parameters/)
- **Commands Manual**: [Command Manual](https://geogebra.github.io/docs/manual/en/Commands/)
- **XML Reference**: [XML Format](https://geogebra.github.io/docs/reference/en/XML/)
- **Manual**: [GeoGebra Manual](https://geogebra.github.io/docs/manual/en/)

### Libraries & Packages
- **React Wrapper**: [react-geogebra npm](https://www.npmjs.com/package/react-geogebra)
- **GitHub**: [geogebra/integration](https://github.com/geogebra/integration)

### Community & Examples
- **Examples**: [GeoGebra Examples](https://www.geogebra.org/)
- **Tutorials**: [GeoGebra Tutorials](https://www.geogebra.org/m/)

---

## 13. Common Use Cases

### 13.1 Function Graphing
```typescript
// Basic function
'f(x) = x^2'

// Multiple functions
'f(x) = sin(x)'
'g(x) = cos(x)'
'h(x) = f(x) + g(x)'

// Family of functions
'f(x, a) = a * x^2'
'a = Slider(-5, 5, 0.1)'
```

### 13.2 Geometry
```typescript
// Triangle construction
'A = (0, 0)'
'B = (4, 0)'
'C = (2, 3)'
'poly1 = Polygon(A, B, C)'

// Circle and tangents
'O = (0, 0)'
'c = Circle(O, 3)'
'P = (5, 0)'
'l = Line(O, P)'
't = Tangent(P, c)'
```

### 13.3 3D Visualizations
```typescript
// 3D surface
'Surface(x^2 - y^2, x, -5, 5, y, -5, 5)'

// Torus
'Surface((2+cos(u))*cos(v), (2+cos(u))*sin(v), sin(u), u, 0, 2*pi, v, 0, 2*pi)'

// 3D parametric curve
'Curve(cos(t), sin(t), t/2, t, 0, 6*pi)'
```

### 13.4 Calculus
```typescript
// Derivative
'f(x) = x^3 - 3x'
'Df = Derivative(f)'

// Integral
'F = Integral(f, 0, 2)'

// Tangent
'A = (1, f(1))'
't = Tangent(A, f)'
```

### 13.5 Statistics
```typescript
// Data set
'A = {1, 2, 3, 4, 5}'
'B = {2, 4, 6, 8, 10}'

// Statistics
'MeanA = Mean(A)'
'SdA = StandardDeviation(A)'

// Histogram
'BarChart(A, B)'
```

---

## 14. Troubleshooting

### Common Issues

1. **Script not loading**: Ensure `deployggb.js` is loaded before creating the applet
2. **API not available**: Wait for `appletOnLoad` callback before using API methods
3. **Memory leaks**: Clean up listeners and applet instances on unmount
4. **Invalid commands**: Validate GeoGebra syntax before executing
5. **Performance issues**: Use `evalCommand` for bulk operations instead of individual calls

### Debug Tips

```typescript
// Enable debug mode
const params = {
  ...,
  showToolBar: true,
  showAlgebraInput: true,
  appletOnLoad: (api: any) => {
    console.log('API methods:', Object.keys(api))
    console.log('All objects:', api.getAllObjectNames())
  }
}

// Log errors
api.registerClientListener((event: any) => {
  if (event.type === 'error') {
    console.error('GeoGebra error:', event)
  }
})
```

---

## Conclusion

GeoGebra provides a powerful platform for creating interactive mathematical visualizations in Next.js applications. With its comprehensive API, multiple embedding options, and extensive command library, it's well-suited for AI-generated educational content. The integration patterns outlined in this research provide a solid foundation for building engaging, interactive learning experiences.

Key takeaways:
- **Flexibility**: Multiple embedding methods to suit different use cases
- **Programmatic control**: Full API for dynamic content generation
- **Interactive parameters**: Sliders, input boxes, and event listeners for user engagement
- **AI-compatible**: Structured output formats suitable for AI generation
- **Comprehensive**: Supports 2D, 3D, CAS, statistics, and more

By following the implementation strategy and leveraging the provided examples, you can build a robust GeoGebra integration that enhances your AI-powered educational platform.
