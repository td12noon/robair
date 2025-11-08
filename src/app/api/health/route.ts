import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Rob Air API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}