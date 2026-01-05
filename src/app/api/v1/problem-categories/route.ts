// src/app/api/v1/problem-categories/route.ts
// ✅ Uses ProblemCategory model from schema

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/v1/problem-categories
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

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('Error fetching problem categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problem categories' },
      { status: 500 }
    );
  }
}

// POST /api/v1/problem-categories
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