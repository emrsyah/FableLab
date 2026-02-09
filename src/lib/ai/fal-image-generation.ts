/**
 * Component-based image generation using Fal.ai
 *
 * Two-phase approach for consistent educational imagery:
 * 1. Generate base components (characters, backgrounds, style references) from visual style guide
 * 2. Edit these components per scene using fal-ai/nano-banana-pro/edit
 *
 * Benefits:
 * - Consistent character appearance across scenes
 * - Faster generation (editing is faster than text-to-image)
 * - Lower cost (edits are cheaper than full generation)
 * - Better style control with reference images
 */

import { subscribe } from "@fal-ai/serverless-client";
import type {
  CharacterSpec,
  EnvironmentSpec,
  VisualStyleGuide,
} from "@/types/adk-types";

// ============================================================================
// TYPES
// ============================================================================

export interface BaseComponent {
  id: string;
  componentType: "character" | "background" | "style_reference" | "prop";
  componentName: string;
  imageUrl: string;
  metadata?: {
    description?: string;
    tags?: string[];
    generationPrompt?: string;
    spec?: Record<string, unknown>;
  };
}

export interface ComponentGenerationResult {
  components: BaseComponent[];
  styleGuide: VisualStyleGuide;
}

export interface SceneImageGenerationOptions {
  sceneTitle: string;
  sceneImagePrompt: string;
  sceneNumber: number;
  baseComponents: BaseComponent[];
  styleDescription?: string;
}

interface FalImageResult {
  images: Array<{ url: string; file_name: string }>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const FAL_KEY = process.env.FAL_KEY;

function checkFalKey(): void {
  if (!FAL_KEY) {
    throw new Error("FAL_KEY environment variable is not set");
  }
}

// ============================================================================
// COMPONENT GENERATION (PHASE 1)
// ============================================================================

/**
 * Generate all base components for a lesson from visual style guide
 *
 * This is a one-time operation per lesson that creates:
 * - Character bases (neutral poses)
 * - Background bases (wide shot, closeup)
 * - Style reference image
 */
export async function generateBaseComponents(
  styleGuide: VisualStyleGuide,
  _lessonId: string,
): Promise<ComponentGenerationResult> {
  checkFalKey();

  const components: BaseComponent[] = [];

  // 1. Generate character bases
  for (const character of styleGuide.characters) {
    const characterBase = await generateCharacterBase(character, styleGuide);
    components.push(characterBase);
  }

  // 2. Generate environment backgrounds
  const backgrounds = await generateBackgroundBases(styleGuide);
  components.push(...backgrounds);

  // 3. Generate style reference
  const styleRef = await generateStyleReference(styleGuide);
  components.push(styleRef);

  return { components, styleGuide };
}

/**
 * Generate base character image in neutral pose
 */
async function generateCharacterBase(
  character: CharacterSpec,
  styleGuide: VisualStyleGuide,
): Promise<BaseComponent> {
  const prompt = buildCharacterPrompt(character, styleGuide, "neutral");

  const result = (await subscribe("fal-ai/nano-banana", {
    input: {
      prompt,
      image_size: "square_1_1",
      num_inference_steps: 4,
      enable_safety_checker: true,
      seed: Math.floor(Math.random() * 1000000),
    },
    logs: false,
  })) as FalImageResult;

  if (!result.images || result.images.length === 0) {
    throw new Error(`No image returned for character: ${character.name}`);
  }

  const tempImageUrl = result.images[0].url;
  const imageUrl = await uploadToUploadthing(
    tempImageUrl,
    `char-${character.name.toLowerCase().replace(/\s+/g, "-")}`,
  );

  return {
    id: `char_${character.name}_${Date.now()}`,
    componentType: "character",
    componentName: character.name,
    imageUrl,
    metadata: {
      description: `Base character: ${character.appearance}`,
      tags: [
        "character",
        character.role,
        character.age_group,
        ...character.key_features,
      ],
      generationPrompt: prompt,
      spec: character as unknown as Record<string, unknown>,
    },
  };
}

/**
 * Generate background bases for the environment
 */
async function generateBackgroundBases(
  styleGuide: VisualStyleGuide,
): Promise<BaseComponent[]> {
  const backgrounds: BaseComponent[] = [];

  // Primary environment (wide shot)
  const primaryBg = await generateSingleBackground(
    styleGuide.environment,
    styleGuide,
    "wide_shot",
  );
  backgrounds.push(primaryBg);

  // Closeup background for character-focused scenes
  const closeupBg = await generateSingleBackground(
    styleGuide.environment,
    styleGuide,
    "closeup",
  );
  backgrounds.push(closeupBg);

  return backgrounds;
}

/**
 * Generate a single background image
 */
async function generateSingleBackground(
  environment: EnvironmentSpec,
  styleGuide: VisualStyleGuide,
  shotType: "wide_shot" | "closeup",
): Promise<BaseComponent> {
  const shotDesc =
    shotType === "wide_shot"
      ? "wide shot showing full environment with depth"
      : "closeup background, blurred depth of field, shallow focus";

  const { color_palette, lighting_style, setting_type, time_of_day, weather } =
    environment;
  const colors = Object.values(color_palette).join(", ");

  const prompt = `
    ${styleGuide.art_direction.medium} illustration of ${setting_type}.
    ${shotDesc}. Time of day: ${time_of_day}. Weather: ${weather}.
    Colors: ${colors}.
    Lighting: ${lighting_style}.
    Style: ${styleGuide.art_direction.technique}, inspired by ${styleGuide.art_direction.inspiration}.
    Detail level: ${styleGuide.art_direction.detail_level}.
    ${styleGuide.technical_tokens}
  `.trim();

  const result = (await subscribe("fal-ai/nano-banana", {
    input: {
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      enable_safety_checker: true,
      seed: Math.floor(Math.random() * 1000000),
    },
    logs: false,
  })) as FalImageResult;

  if (!result.images || result.images.length === 0) {
    throw new Error(`No image returned for background: ${shotType}`);
  }

  const tempImageUrl = result.images[0].url;
  const imageUrl = await uploadToUploadthing(tempImageUrl, `bg-${shotType}`);

  return {
    id: `bg_${shotType}_${Date.now()}`,
    componentType: "background",
    componentName: shotType,
    imageUrl,
    metadata: {
      description: `${shotType} background: ${environment.setting_type}`,
      tags: [
        "background",
        shotType,
        environment.setting_type,
        environment.time_of_day,
      ],
      generationPrompt: prompt,
      spec: environment as unknown as Record<string, unknown>,
    },
  };
}

/**
 * Generate style reference image
 */
async function generateStyleReference(
  styleGuide: VisualStyleGuide,
): Promise<BaseComponent> {
  const { art_direction, environment, story_theme, technical_tokens } =
    styleGuide;
  const { color_palette, lighting_style, setting_type } = environment;
  const colors = Object.values(color_palette).join(", ");

  const prompt = `
    A sample illustration for ${story_theme}.
    Style: ${art_direction.medium} in ${art_direction.technique} style.
    Inspired by ${art_direction.inspiration}.
    Setting: ${setting_type}.
    Color palette: ${colors}.
    Lighting: ${lighting_style}.
    Detail level: ${art_direction.detail_level}.
    ${technical_tokens}
  `.trim();

  const result = (await subscribe("fal-ai/nano-banana", {
    input: {
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      enable_safety_checker: true,
      seed: Math.floor(Math.random() * 1000000),
    },
    logs: false,
  })) as FalImageResult;

  if (!result.images || result.images.length === 0) {
    throw new Error("No image returned for style reference");
  }

  const tempImageUrl = result.images[0].url;
  const imageUrl = await uploadToUploadthing(tempImageUrl, "style-ref");

  return {
    id: `style_ref_${Date.now()}`,
    componentType: "style_reference",
    componentName: "style_reference",
    imageUrl,
    metadata: {
      description: `Style reference: ${art_direction.medium} ${art_direction.technique}`,
      tags: [
        "style",
        "reference",
        art_direction.medium,
        art_direction.technique,
      ],
      generationPrompt: prompt,
      spec: art_direction as unknown as Record<string, unknown>,
    },
  };
}

// ============================================================================
// SCENE IMAGE GENERATION (PHASE 2)
// ============================================================================

/**
 * Generate scene image by editing base components
 *
 * Uses fal-ai/nano-banana-pro/edit to create consistent scene images
 * from pre-generated base components.
 */
export async function generateSceneImage(
  options: SceneImageGenerationOptions,
): Promise<string> {
  checkFalKey();

  const { sceneTitle, sceneImagePrompt, baseComponents, styleDescription } =
    options;

  // Select appropriate bases
  const characterBases = baseComponents.filter(
    (c) => c.componentType === "character",
  );
  const backgroundBases = baseComponents.filter(
    (c) => c.componentType === "background",
  );
  const styleRefs = baseComponents.filter(
    (c) => c.componentType === "style_reference",
  );

  // Build image_urls array (max 4 images for edit endpoint)
  const imageUrls: string[] = [];

  // Add primary background first (most important for composition)
  if (backgroundBases.length > 0) {
    const wideBg =
      backgroundBases.find((b) => b.componentName === "wide_shot") ||
      backgroundBases[0];
    imageUrls.push(wideBg.imageUrl);
  }

  // Add main character
  if (characterBases.length > 0) {
    const mainChar =
      characterBases.find((c) => c.metadata?.tags?.includes("main")) ||
      characterBases[0];
    if (!imageUrls.includes(mainChar.imageUrl)) {
      imageUrls.push(mainChar.imageUrl);
    }
  }

  // Add supporting character if available and within limit
  if (characterBases.length > 1 && imageUrls.length < 3) {
    const supportingChar = characterBases.find((c) =>
      c.metadata?.tags?.includes("supporting"),
    );
    if (supportingChar && !imageUrls.includes(supportingChar.imageUrl)) {
      imageUrls.push(supportingChar.imageUrl);
    }
  }

  // Add style reference if available and within limit
  if (styleRefs.length > 0 && imageUrls.length < 4) {
    const styleRef = styleRefs[0];
    if (!imageUrls.includes(styleRef.imageUrl)) {
      imageUrls.push(styleRef.imageUrl);
    }
  }

  // Build editing prompt
  const editPrompt = buildEditPrompt(
    sceneImagePrompt,
    sceneTitle,
    styleDescription,
  );

  // Call fal-ai/nano-banana-pro/edit
  const result = (await subscribe("fal-ai/nano-banana-pro/edit", {
    input: {
      prompt: editPrompt,
      image_urls: imageUrls,
      num_images: 1,
      aspect_ratio: "auto",
      output_format: "png",
      resolution: "1K",
      safety_tolerance: "4",
    },
    logs: false,
  })) as FalImageResult;

  if (!result.images || result.images.length === 0) {
    throw new Error("No image returned from Fal.ai edit endpoint");
  }

  // Upload to permanent storage
  const finalUrl = await uploadToUploadthing(
    result.images[0].url,
    `scene-${options.sceneNumber}-${sceneTitle.toLowerCase().replace(/\s+/g, "-")}`,
  );

  return finalUrl;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build a prompt for character base generation
 */
function buildCharacterPrompt(
  character: CharacterSpec,
  styleGuide: VisualStyleGuide,
  pose: "neutral" | "action",
): string {
  const poseDesc =
    pose === "neutral"
      ? "standing in neutral pose, full body visible, centered"
      : "in dynamic action pose";

  const { art_direction, environment, technical_tokens } = styleGuide;
  const { color_palette, lighting_style } = environment;
  const colors = Object.values(color_palette).join(", ");

  return `
    ${art_direction.medium} illustration of ${character.name}.
    ${character.appearance}. Key features: ${character.key_features.join(", ")}.
    Age: ${character.age_group}. Personality: ${character.personality_traits.join(", ")}.
    ${poseDesc}.
    Background: simple gradient using ${colors}.
    Style: ${art_direction.technique}, inspired by ${art_direction.inspiration}.
    Detail level: ${art_direction.detail_level}.
    Lighting: ${lighting_style}.
    ${technical_tokens}
  `.trim();
}

/**
 * Build an editing prompt for scene generation
 */
function buildEditPrompt(
  scenePrompt: string,
  sceneTitle: string,
  styleDescription?: string,
): string {
  const basePrompt = `
    Create an illustration for a STEM lesson scene titled "${sceneTitle}".
    Scene description: ${scenePrompt}
  `.trim();

  const styleGuidance = styleDescription
    ? `
    Maintain consistent art style: ${styleDescription}
  `.trim()
    : "";

  const editInstructions = `
    Edit the provided base images to match this scene:
    - Maintain character consistency and proportions
    - Adapt background to match scene setting
    - Add scene-specific elements, actions, and details
    - Keep colors vibrant and educational
    - Ensure clear visual storytelling suitable for students
  `.trim();

  return [basePrompt, styleGuidance, editInstructions]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Upload image to Uploadthing for permanent storage
 */
async function uploadToUploadthing(
  tempImageUrl: string,
  filename: string,
): Promise<string> {
  try {
    const { UTApi } = await import("uploadthing/server");
    const utapi = new UTApi();

    // Fetch the image from Fal.ai temporary URL
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) {
      throw new Error(
        `Failed to fetch image from Fal.ai: ${imageResponse.statusText}`,
      );
    }

    const imageBlob = await imageResponse.blob();
    const imageFile = new File([imageBlob], `${filename}-${Date.now()}.png`, {
      type: "image/png",
    });

    // Upload to Uploadthing
    const uploadResult = await utapi.uploadFiles([imageFile]);

    if (uploadResult[0]?.data?.ufsUrl) {
      return uploadResult[0].data.ufsUrl;
    }

    console.warn("Uploadthing upload failed, using temporary Fal.ai URL");
    return tempImageUrl;
  } catch (uploadError) {
    console.error("Error uploading image to Uploadthing:", uploadError);
    // Fallback to temporary URL
    return tempImageUrl;
  }
}

// ============================================================================
// LEGACY FALLBACK
// ============================================================================

/**
 * Legacy direct text-to-image generation (for fallback)
 * Use this when component-based generation is not available
 */
export async function generateImageDirect(
  prompt: string,
  title: string,
): Promise<string> {
  checkFalKey();

  const fullPrompt = `A digital illustration for a STEM lesson. ${prompt}. Style: vibrant, educational, engaging for students.`;

  const result = (await subscribe("fal-ai/nano-banana", {
    input: {
      prompt: fullPrompt,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      enable_safety_checker: true,
      seed: Math.floor(Math.random() * 1000000),
    },
    logs: false,
  })) as FalImageResult;

  if (!result.images || result.images.length === 0) {
    throw new Error("No image returned from Fal.ai");
  }

  const tempImageUrl = result.images[0].url;
  return uploadToUploadthing(
    tempImageUrl,
    title.toLowerCase().replace(/\s+/g, "-"),
  );
}
