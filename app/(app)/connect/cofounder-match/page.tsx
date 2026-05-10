import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CofounderMatchClient from './CofounderMatchClient'

type Profile = {
  id: string
  username: string
  status_tags?: string[]
  created_at: string
  bio?: string
  skills?: string[]
  cofounder_stage?: string
}

type CofounderRequest = {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export default async function CoFounderMatchPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated (optional)
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch profiles where open_to_cofounder is true (public data)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .eq('open_to_cofounder', true)

  if (profilesError) {
  }

  // Default values for non-authenticated users
  let filteredProfiles = profiles || []
  let isListed = false
  let requests = []
  let connectedProfiles = []
  let incomingRequestProfiles = []
  let outgoingRequestProfiles = []
  let currentUserId = ""
  
  // Only fetch user-specific data if authenticated
  if (user) {
    currentUserId = user.id
    
    // Fetch cofounder requests where user is sender or receiver
    const { data: requestsData, error: requestsError } = await supabase
      .from('cofounder_requests')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    if (requestsError) {
    } else {
      requests = requestsData || []
    }

    // Build a Set of user IDs who have pending or accepted requests with current user
    const allRequestedUserIds = new Set<string>()
    requests?.forEach(request => {
      if (request.sender_id === user.id) {
        allRequestedUserIds.add(request.receiver_id)
      } else {
        allRequestedUserIds.add(request.sender_id)
      }
    })

    // Fetch current user's profile to check if they are listed
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('open_to_cofounder')
      .eq('id', user.id)
      .single()

    isListed = currentUserProfile?.open_to_cofounder || false

    // Filter out users with any requests from profiles array (but keep current user if they're listed)
    filteredProfiles = profiles?.filter(profile => 
      !allRequestedUserIds.has(profile.id) || profile.id === user.id
    ) || []

    // If current user is listed and not already in filteredProfiles, add them
    if (isListed && !filteredProfiles.find(p => p.id === user.id)) {
      const { data: currentUserFullProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (currentUserFullProfile) {
        filteredProfiles.push(currentUserFullProfile)
      }
    }

    // Fetch accepted cofounder connections
    const { data: connections } = await supabase
      .from('cofounder_requests')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted')

    // Extract partner IDs from connections
    const partnerIds = connections?.map(conn => 
      conn.sender_id === user.id ? conn.receiver_id : conn.sender_id
    ).filter(Boolean) || []

    // Fetch profiles for connected partners
    if (partnerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', partnerIds)
      connectedProfiles = profiles || []
    }

    // Fetch profiles for incoming request senders (they might be filtered out from main profiles)
    const incomingRequestSenderIds = requests
      ?.filter(req => req.receiver_id === user.id && req.status === 'pending')
      .map(req => req.sender_id) || []
    
    if (incomingRequestSenderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', incomingRequestSenderIds)
      incomingRequestProfiles = profiles || []
    }

    // Fetch profiles for outgoing request receivers (they might be filtered out from main profiles)
    const outgoingRequestReceiverIds = requests
      ?.filter(req => req.sender_id === user.id && req.status === 'pending')
      .map(req => req.receiver_id) || []
    
    if (outgoingRequestReceiverIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', outgoingRequestReceiverIds)
      outgoingRequestProfiles = profiles || []
    }
  }

  return (
    <CofounderMatchClient 
      profiles={filteredProfiles}
      requests={requests}
      isListed={isListed}
      connectedProfiles={connectedProfiles}
      incomingRequestProfiles={incomingRequestProfiles}
      outgoingRequestProfiles={outgoingRequestProfiles}
      currentUserId={currentUserId}
    />
  )
}
