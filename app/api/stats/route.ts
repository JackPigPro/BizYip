import { NextResponse } from 'next/server'
import { getLiveStats } from '@/utils/stats'

export async function GET() {
  try {
    const stats = await getLiveStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
