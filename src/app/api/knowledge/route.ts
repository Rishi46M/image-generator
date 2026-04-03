import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Simple in-memory cache
let knowledgeCache: {
  data: Awaited<ReturnType<typeof db.knowledgeEntry.findMany>> | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = 60 * 1000; // 1 minute cache

// GET - Retrieve all knowledge entries or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    // Use cache for full list queries without search
    if (!search && !category && knowledgeCache.data && Date.now() - knowledgeCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ success: true, data: knowledgeCache.data });
    }

    let entries;

    if (search) {
      // Optimized search with indexed fields
      const searchTerms = search.toLowerCase().split(/\s+/).filter(Boolean);
      
      if (searchTerms.length === 0) {
        entries = await db.knowledgeEntry.findMany({ take: 10 });
      } else {
        entries = await db.knowledgeEntry.findMany({
          where: {
            OR: searchTerms.flatMap(term => [
              { title: { contains: term } },
              { keywords: { contains: term } },
              { description: { contains: term } },
            ])
          },
          take: 10,
        });
      }
    } else if (category) {
      entries = await db.knowledgeEntry.findMany({
        where: { category },
      });
    } else {
      entries = await db.knowledgeEntry.findMany({
        orderBy: { category: 'asc' },
      });
      
      // Update cache
      knowledgeCache = { data: entries, timestamp: Date.now() };
    }

    return NextResponse.json({ success: true, data: entries });
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch knowledge entries' },
      { status: 500 }
    );
  }
}

// POST - Create new knowledge entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, title, description, keywords, promptHint, examples } = body;

    if (!category || !title || !description || !keywords || !promptHint) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const entry = await db.knowledgeEntry.create({
      data: {
        category,
        title,
        description,
        keywords,
        promptHint,
        examples: examples ? JSON.stringify(examples) : null,
      },
    });

    // Invalidate cache
    knowledgeCache = { data: null, timestamp: 0 };

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create knowledge entry' },
      { status: 500 }
    );
  }
}

// PUT - Update knowledge entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing entry ID' },
        { status: 400 }
      );
    }

    const entry = await db.knowledgeEntry.update({
      where: { id },
      data: {
        ...data,
        examples: data.examples ? JSON.stringify(data.examples) : null,
      },
    });

    // Invalidate cache
    knowledgeCache = { data: null, timestamp: 0 };

    return NextResponse.json({ success: true, data: entry });
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update knowledge entry' },
      { status: 500 }
    );
  }
}

// DELETE - Delete knowledge entry
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing entry ID' },
        { status: 400 }
      );
    }

    await db.knowledgeEntry.delete({
      where: { id },
    });

    // Invalidate cache
    knowledgeCache = { data: null, timestamp: 0 };

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete knowledge entry' },
      { status: 500 }
    );
  }
}
