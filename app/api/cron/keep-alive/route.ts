import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/app/lib/supabase/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const secret = request.nextUrl.searchParams.get('secret')

  const isAuthorized =
    authHeader === `Bearer ${process.env.CRON_SECRET}` ||
    secret === process.env.CRON_SECRET

  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createServiceClient()

    const { count, error } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json(
        { status: 'error', message: error.message, timestamp: new Date().toISOString() },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'alive',
      classes_count: count,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err instanceof Error ? err.message : 'Unknown error', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
