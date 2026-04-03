import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Cache for templates
let templatesCache: {
  data: Awaited<ReturnType<typeof db.promptTemplate.findMany>> | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = 60 * 1000; // 1 minute cache

// GET - Retrieve prompt templates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const favorites = searchParams.get('favorites');

    // Use cache for full list queries
    if (!category && favorites !== 'true' && templatesCache.data && Date.now() - templatesCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ success: true, data: templatesCache.data });
    }

    let where = {};
    
    if (category) {
      where = { category };
    }
    
    if (favorites === 'true') {
      where = { ...where, isFavorite: true };
    }

    const templates = await db.promptTemplate.findMany({
      where,
      orderBy: [
        { isFavorite: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Update cache for full list
    if (!category && favorites !== 'true') {
      templatesCache = { data: templates, timestamp: Date.now() };
    }

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST - Create new template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, template, category, isFavorite } = body;

    if (!name?.trim() || !template?.trim() || !category?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newTemplate = await db.promptTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        template: template.trim(),
        category: category.trim(),
        isFavorite: isFavorite || false,
      },
    });

    // Invalidate cache
    templatesCache = { data: null, timestamp: 0 };

    return NextResponse.json({ success: true, data: newTemplate });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT - Update template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing template ID' },
        { status: 400 }
      );
    }

    const updated = await db.promptTemplate.update({
      where: { id },
      data,
    });

    // Invalidate cache
    templatesCache = { data: null, timestamp: 0 };

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing template ID' },
        { status: 400 }
      );
    }

    await db.promptTemplate.delete({
      where: { id },
    });

    // Invalidate cache
    templatesCache = { data: null, timestamp: 0 };

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
