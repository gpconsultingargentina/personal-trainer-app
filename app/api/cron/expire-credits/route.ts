import { NextRequest, NextResponse } from 'next/server'
import { expireCredits } from '@/app/actions/credits'

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await expireCredits()

    return NextResponse.json({
      success: true,
      expiredCount: result.expiredCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error expiring credits:', error)
    return NextResponse.json(
      {
        error: 'Error processing credit expirations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
