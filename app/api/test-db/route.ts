import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(5)
    
    // Test ideas table
    const { data: ideas, error: ideasError } = await supabase
      .from('ideas')
      .select('id, title')
      .limit(5)
    
    // Test cofounder_requests table
    const { data: requests, error: requestsError } = await supabase
      .from('cofounder_requests')
      .select('id, status')
      .limit(5)
    
    return NextResponse.json({
      profiles: { data: profiles, error: profilesError?.message },
      ideas: { data: ideas, error: ideasError?.message },
      requests: { data: requests, error: requestsError?.message },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Database test failed' },
      { status: 500 }
    )
  }
}
