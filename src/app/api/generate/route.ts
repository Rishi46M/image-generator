import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Cache for ZAI instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// System prompts - defined once
const ENHANCEMENT_SYSTEM_PROMPT = `You are an expert prompt engineer for AI image generation. Your task is to enhance user prompts using the provided context to create more detailed, visually rich prompts.

Rules:
1. Keep the original intent of the user's prompt
2. Incorporate relevant style, mood, and technical details from the context
3. Add quality descriptors (high quality, detailed, professional)
4. Keep the enhanced prompt concise but descriptive (under 150 words)
5. Return ONLY the enhanced prompt, no explanations`;

const BASIC_ENHANCEMENT_SYSTEM_PROMPT = `You are an expert prompt engineer for AI image generation. Enhance the user's prompt to be more detailed and visually rich.

Rules:
1. Keep the original intent
2. Add style, lighting, and quality descriptors
3. Keep under 150 words
4. Return ONLY the enhanced prompt`;

// RAG-based image generation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, size = '1024x1024' } = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate size
    const validSizes = ['1024x1024', '1344x768', '768x1344', '1440x720', '1152x864', '864x1152', '720x1440'];
    if (!validSizes.includes(size)) {
      return NextResponse.json(
        { success: false, error: 'Invalid image size' },
        { status: 400 }
      );
    }

    // Step 1: Retrieve relevant context from knowledge base (RAG Retrieval)
    // Optimize: Only search for meaningful words
    const searchTerms = prompt
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2) // Skip short words
      .slice(0, 6); // Limit search terms
    
    let relevantEntries: Awaited<ReturnType<typeof db.knowledgeEntry.findMany>> = [];
    
    if (searchTerms.length > 0) {
      relevantEntries = await db.knowledgeEntry.findMany({
        where: {
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { keywords: { contains: term } },
          ])
        },
        take: 4, // Reduced from 5 for faster query
      });
    }

    // Step 2: Build enhanced prompt using LLM (RAG Augmentation)
    const zai = await getZAI();
    
    let enhancedPrompt = prompt.trim();
    let retrievedContext: string[] = [];

    try {
      if (relevantEntries.length > 0) {
        // Build context from retrieved entries
        retrievedContext = relevantEntries.map(e => `${e.category}: ${e.title}`);
        const contextList = relevantEntries.map(e => `- ${e.category}: ${e.promptHint}`).join('\n');

        // Use LLM to enhance the prompt with retrieved context
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: ENHANCEMENT_SYSTEM_PROMPT },
            { role: 'user', content: `Original prompt: "${prompt}"\n\nAvailable context:\n${contextList}\n\nEnhance this prompt for high-quality image generation.` }
          ],
          thinking: { type: 'disabled' }
        });

        const result = completion.choices[0]?.message?.content;
        if (result) {
          enhancedPrompt = result;
        }
      } else {
        // Basic enhancement without context
        const completion = await zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: BASIC_ENHANCEMENT_SYSTEM_PROMPT },
            { role: 'user', content: `Enhance this prompt: "${prompt}"` }
          ],
          thinking: { type: 'disabled' }
        });

        const result = completion.choices[0]?.message?.content;
        if (result) {
          enhancedPrompt = result;
        }
      }
    } catch (llmError) {
      console.error('LLM enhancement failed, using original prompt:', llmError);
      // Continue with original prompt if LLM fails
    }

    // Step 3: Generate image with enhanced prompt
    const response = await zai.images.generations.create({
      prompt: enhancedPrompt,
      size: size,
    });

    const imageBase64 = response.data[0]?.base64;
    
    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate image - no data returned' },
        { status: 500 }
      );
    }

    // Step 4: Save to database
    const generatedImage = await db.generatedImage.create({
      data: {
        originalPrompt: prompt,
        enhancedPrompt,
        imageData: imageBase64,
        size,
        retrievedContext: retrievedContext.length > 0 ? JSON.stringify(retrievedContext) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: generatedImage.id,
        originalPrompt: prompt,
        enhancedPrompt,
        imageData: imageBase64,
        retrievedContext,
        size,
        createdAt: generatedImage.createdAt,
      },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to generate image';
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
