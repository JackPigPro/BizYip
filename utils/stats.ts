import { createAdminClient } from '@/utils/supabase/admin'

export interface LiveStats {
  totalUsers: number
  acceptedMatches: number
  totalIdeas: number
}

export async function getLiveStats(): Promise<LiveStats> {
  const supabase = createAdminClient()
  

  // Test basic connection first
  const { data: testData, error: testError } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
  

  // Get total users from profiles table
  const { count: totalUsers, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
  

  // Get accepted cofounder requests
  const { count: acceptedMatches, error: matchesError } = await supabase
    .from('cofounder_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')
  

  // Get total ideas (both public and private)
  const { count: totalIdeas, error: ideasError } = await supabase
    .from('ideas')
    .select('*', { count: 'exact', head: true })
  
  

  const stats = {
    totalUsers: totalUsers || 0,
    acceptedMatches: acceptedMatches || 0,
    totalIdeas: totalIdeas || 0,
  }
  
  return stats
}
