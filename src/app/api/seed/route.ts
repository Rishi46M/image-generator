import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Seed initial knowledge base entries for RAG
export async function POST() {
  try {
    const knowledgeEntries = [
      // Art Styles
      {
        category: 'style',
        title: 'Oil Painting',
        description: 'Classic oil painting technique with rich textures and visible brushstrokes',
        keywords: 'oil, painting, classic, traditional, brushstrokes, texture, artistic',
        promptHint: 'oil painting style, visible brushstrokes, rich textures, classic art',
      },
      {
        category: 'style',
        title: 'Watercolor',
        description: 'Soft, flowing watercolor technique with gentle color blending',
        keywords: 'watercolor, soft, flowing, gentle, blend, artistic, delicate',
        promptHint: 'watercolor painting, soft color blending, delicate brushstrokes, flowing composition',
      },
      {
        category: 'style',
        title: 'Digital Art',
        description: 'Modern digital illustration with clean lines and vibrant colors',
        keywords: 'digital, illustration, modern, clean, vibrant, vector, graphic',
        promptHint: 'digital art, clean lines, vibrant colors, modern illustration style',
      },
      {
        category: 'style',
        title: 'Photorealistic',
        description: 'Ultra-realistic photography style with high detail and natural lighting',
        keywords: 'photorealistic, realistic, photo, detailed, natural, photography',
        promptHint: 'photorealistic, highly detailed, natural lighting, professional photography',
      },
      {
        category: 'style',
        title: 'Impressionist',
        description: 'Impressionist art style with light, color, and movement focus',
        keywords: 'impressionist, impressionism, light, color, movement, monet, artistic',
        promptHint: 'impressionist style, light and color focus, visible brushwork, capturing movement',
      },

      // Moods
      {
        category: 'mood',
        title: 'Dramatic',
        description: 'High contrast, moody lighting with strong emotional impact',
        keywords: 'dramatic, contrast, moody, emotional, intense, powerful, bold',
        promptHint: 'dramatic lighting, high contrast, moody atmosphere, emotional impact',
      },
      {
        category: 'mood',
        title: 'Serene',
        description: 'Peaceful, calm atmosphere with soft colors and gentle lighting',
        keywords: 'serene, peaceful, calm, tranquil, soft, gentle, relaxing',
        promptHint: 'serene atmosphere, peaceful mood, soft gentle lighting, calm composition',
      },
      {
        category: 'mood',
        title: 'Mysterious',
        description: 'Enigmatic atmosphere with shadows, fog, and intrigue',
        keywords: 'mysterious, enigmatic, shadow, fog, intrigue, dark, secret',
        promptHint: 'mysterious atmosphere, shadows and fog, enigmatic mood, sense of intrigue',
      },
      {
        category: 'mood',
        title: 'Ethereal',
        description: 'Otherworldly, dreamy quality with soft glow and magical elements',
        keywords: 'ethereal, dreamy, magical, otherworldly, soft glow, fantasy, mystical',
        promptHint: 'ethereal quality, dreamy atmosphere, soft magical glow, otherworldly feel',
      },

      // Subjects
      {
        category: 'subject',
        title: 'Landscape',
        description: 'Natural outdoor scenery with mountains, forests, or coastlines',
        keywords: 'landscape, nature, outdoor, mountain, forest, coastline, scenery, horizon',
        promptHint: 'beautiful landscape, natural scenery, outdoor environment',
      },
      {
        category: 'subject',
        title: 'Portrait',
        description: 'Human or character face with focus on expression and features',
        keywords: 'portrait, face, person, character, expression, features, human',
        promptHint: 'portrait, detailed facial features, expressive, character study',
      },
      {
        category: 'subject',
        title: 'Architecture',
        description: 'Buildings and structures with focus on design and perspective',
        keywords: 'architecture, building, structure, design, urban, city, perspective',
        promptHint: 'architectural design, buildings and structures, urban environment',
      },
      {
        category: 'subject',
        title: 'Nature',
        description: 'Plants, animals, and natural elements in their environment',
        keywords: 'nature, plants, animals, wildlife, flora, fauna, natural',
        promptHint: 'nature scene, wildlife and flora, natural environment',
      },
      {
        category: 'subject',
        title: 'Abstract',
        description: 'Non-representational art focusing on shapes, colors, and forms',
        keywords: 'abstract, non-representational, shapes, colors, forms, geometric',
        promptHint: 'abstract composition, geometric shapes, vibrant colors, modern art',
      },

      // Lighting
      {
        category: 'lighting',
        title: 'Golden Hour',
        description: 'Warm, soft lighting during sunrise or sunset',
        keywords: 'golden hour, sunset, sunrise, warm, soft light, orange, golden',
        promptHint: 'golden hour lighting, warm sunset glow, soft warm light',
      },
      {
        category: 'lighting',
        title: 'Studio Lighting',
        description: 'Professional controlled lighting for product or portrait photography',
        keywords: 'studio, lighting, professional, controlled, product, portrait, setup',
        promptHint: 'professional studio lighting, soft box, three-point lighting setup',
      },
      {
        category: 'lighting',
        title: 'Neon',
        description: 'Vibrant neon lights creating cyberpunk or retro aesthetic',
        keywords: 'neon, lights, cyberpunk, retro, vibrant, colorful, glow',
        promptHint: 'neon lights, vibrant glow, cyberpunk aesthetic, colorful illumination',
      },
      {
        category: 'lighting',
        title: 'Moonlight',
        description: 'Soft, cool lighting from moon creating nighttime atmosphere',
        keywords: 'moonlight, night, moon, cool, dark, nocturnal, midnight',
        promptHint: 'moonlight illumination, soft cool glow, nighttime atmosphere',
      },

      // Techniques
      {
        category: 'technique',
        title: 'Bokeh Effect',
        description: 'Blurred background with sharp subject focus',
        keywords: 'bokeh, blur, background, focus, shallow depth, portrait, lens',
        promptHint: 'bokeh effect, shallow depth of field, blurred background, sharp subject focus',
      },
      {
        category: 'technique',
        title: 'Long Exposure',
        description: 'Motion blur capturing movement over time',
        keywords: 'long exposure, motion blur, light trails, smooth, time, movement',
        promptHint: 'long exposure, motion blur effect, light trails, smooth flowing motion',
      },
      {
        category: 'technique',
        title: 'Macro Photography',
        description: 'Extreme close-up showing fine details',
        keywords: 'macro, close-up, detail, tiny, small, magnified, fine',
        promptHint: 'macro photography, extreme close-up, fine details, magnified view',
      },
    ];

    // Templates for quick start
    const templates = [
      {
        name: 'Nature Scene',
        description: 'Create beautiful natural landscapes',
        template: 'A {style} of {subject} during {lighting}, {mood} atmosphere',
        category: 'nature',
        isFavorite: true,
      },
      {
        name: 'Portrait Studio',
        description: 'Professional portrait photography',
        template: 'Professional portrait of {subject}, {lighting}, {style}, high quality',
        category: 'portrait',
        isFavorite: true,
      },
      {
        name: 'Abstract Art',
        description: 'Create abstract compositions',
        template: 'Abstract {style} composition with {mood} colors, {technique}',
        category: 'abstract',
        isFavorite: false,
      },
      {
        name: 'Urban Scene',
        description: 'City and architecture photography',
        template: 'Urban {subject}, {lighting}, {style}, dramatic perspective',
        category: 'urban',
        isFavorite: false,
      },
    ];

    // Clear existing data
    await db.knowledgeEntry.deleteMany({});
    await db.promptTemplate.deleteMany({});

    // Insert knowledge entries
    for (const entry of knowledgeEntries) {
      await db.knowledgeEntry.create({ data: entry });
    }

    // Insert templates
    for (const template of templates) {
      await db.promptTemplate.create({ data: template });
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${knowledgeEntries.length} knowledge entries and ${templates.length} templates`,
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
