// src/app/api/v2/auth/login/route.ts
import { NextRequest } from "next/server";
import { handleLogin } from "@/features/auth/services/login.service";

export async function POST(request: NextRequest) {
  return handleLogin(request);
}
