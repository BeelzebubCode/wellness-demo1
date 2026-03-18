// src/app/api/v2/master/problem-categories/route.ts
// ✅ Uses ProblemCategory model from schema

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/v2/master/problem-categories
export async function GET() {
  try {
    const categories = await prisma.problemCategory.findMany({
      orderBy: { problem_category_id: 'asc' },
    });

    const formattedCategories = categories.map((c) => ({
      id: c.problem_category_id,
      code: c.problem_category_code,
      nameTh: c.problem_category_name_th,
      nameEn: c.problem_category_name_en,
      description: c.problem_category_description,
    }));

    // "OTHER" / "อื่นๆ" always last
    const sorted = formattedCategories.sort((a, b) => {
      const aOther = a.code === "OTHER" ? 1 : 0;
      const bOther = b.code === "OTHER" ? 1 : 0;
      return aOther - bOther;
    });

    return NextResponse.json({
      success: true,
      categories: sorted,
    });
  } catch (error) {
    console.error('Error fetching problem categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problem categories' },
      { status: 500 }
    );
  }
}

// POST /api/v2/master/problem-categories
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, nameTh, nameEn, description } = body;

    if (!code || !nameTh) {
      return NextResponse.json(
        { error: 'Code และชื่อภาษาไทยจำเป็น' },
        { status: 400 }
      );
    }

    const category = await prisma.problemCategory.create({
      data: {
        problem_category_code: code,
        problem_category_name_th: nameTh,
        problem_category_name_en: nameEn,
        problem_category_description: description,
      },
    });

    return NextResponse.json({
      success: true,
      category: {
        id: category.problem_category_id,
        code: category.problem_category_code,
        nameTh: category.problem_category_name_th,
      },
    });
  } catch (error) {
    console.error('Error creating problem category:', error);
    return NextResponse.json(
      { error: 'Failed to create problem category' },
      { status: 500 }
    );
  }
}

// PATCH /api/v2/master/problem-categories
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, code, nameTh, nameEn, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const updated = await prisma.problemCategory.update({
      where: { problem_category_id: Number(id) },
      data: {
        ...(code !== undefined && { problem_category_code: code }),
        ...(nameTh !== undefined && { problem_category_name_th: nameTh }),
        ...(nameEn !== undefined && { problem_category_name_en: nameEn }),
        ...(description !== undefined && { problem_category_description: description }),
      },
    });

    return NextResponse.json({
      success: true,
      category: {
        id: updated.problem_category_id,
        code: updated.problem_category_code,
        nameTh: updated.problem_category_name_th,
      },
    });
  } catch (error) {
    console.error('Error updating problem category:', error);
    return NextResponse.json(
      { error: 'Failed to update problem category' },
      { status: 500 }
    );
  }
}
