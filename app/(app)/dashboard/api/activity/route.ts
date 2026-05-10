import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({ activity: [], pagination: { page: 1, limit: 10, total: 0, hasMore: false } })
}
