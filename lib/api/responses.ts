
import { NextResponse } from 'next/server';

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
    },
    { status }
  );
}

export function apiError(message: string, status: number = 500) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error: { message },
    },
    { status }
  );
}