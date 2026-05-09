import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '@/types/database'
import { rateLimit } from '@/utils/rateLimit'

type Profile = Database['public']['Tables']['profiles']['Row']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch profiles where open_to_cofounder is true
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('open_to_cofounder', true)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    // Fetch cofounder requests where user is sender or receiver
    const { data: requests, error: requestsError } = await supabase
      .from('cofounder_requests')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    if (requestsError) {
      console.error('Error fetching cofounder requests:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch cofounder requests' }, { status: 500 })
    }

    // Build a Set of user IDs who have pending or accepted requests with the current user
    // Note: Declined/cancelled requests are deleted, so they won't appear in this query
    const allRequestedUserIds = new Set<string>()
    requests?.forEach(request => {
      if (request.sender_id === user.id) {
        allRequestedUserIds.add(request.receiver_id)
      } else {
        allRequestedUserIds.add(request.sender_id)
      }
    })

    // Filter out users with any requests from the profiles array (but keep current user)
    const filteredProfiles = profiles?.filter(profile => 
      !allRequestedUserIds.has(profile.id)
    ) || []

    // Fetch current user's profile to check if they are listed
    const { data: currentUserProfile } = await supabase
      .from('profiles')
      .select('open_to_cofounder')
      .eq('id', user.id)
      .single()

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
    let connectedProfiles: Profile[] = []
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
    
    let incomingRequestProfiles: Profile[] = []
    if (incomingRequestSenderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', incomingRequestSenderIds)
      incomingRequestProfiles = profiles || []
    }

    return NextResponse.json({ 
      profiles: filteredProfiles, 
      requests, 
      isListed: currentUserProfile?.open_to_cofounder || false,
      connectedProfiles,
      incomingRequestProfiles
    })
  } catch (error) {
    console.error('Error in GET /api/cofounder-match:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = rateLimit(user.id + '_cofounder', 10, 60 * 60 * 1000)
    if (!allowed) return NextResponse.json({ error: 'Too many requests, please slow down' }, { status: 429 })

    const body = await request.json()
    const { receiver_id } = body

    // UUID validation helper
    const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

    // Input validation
    if (!receiver_id || typeof receiver_id !== 'string' || !isValidUUID(receiver_id)) {
      return NextResponse.json({ error: 'receiver_id is required and must be a valid UUID format' }, { status: 400 })
    }

    if (receiver_id === user.id) {
      return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 })
    }

    // Insert cofounder request
    const { data: newRequest, error: requestError } = await supabase
      .from('cofounder_requests')
      .insert({
        sender_id: user.id,
        receiver_id,
        status: 'pending'
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating cofounder request:', requestError)
      return NextResponse.json({ error: 'Failed to create cofounder request' }, { status: 500 })
    }

    // Insert notification for receiver
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: receiver_id,
        type: 'cofounder_request_received',
        title: 'New Co-founder Request',
        body: 'Someone wants to co-found with you',
        reference_id: user.id,
        reference_type: 'user'
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the request if notification fails
    }

    return NextResponse.json(newRequest)
  } catch (error) {
    console.error('Error in POST /api/cofounder-match:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { request_id, action, open_to_cofounder } = body

    // Handle profile update
    if (open_to_cofounder !== undefined) {
      if (typeof open_to_cofounder !== 'boolean') {
        return NextResponse.json({ error: 'open_to_cofounder must be a boolean' }, { status: 400 })
      }

      // Update the user's profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ open_to_cofounder })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Handle request action (accept/reject)
    if (!request_id || !action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'request_id and action (accept/reject) are required' }, { status: 400 })
    }

    // First, get the request to verify it's for the current user
    const { data: existingRequest, error: fetchError } = await supabase
      .from('cofounder_requests')
      .select('*')
      .eq('id', request_id)
      .eq('receiver_id', user.id) // Ensure user is the receiver
      .eq('status', 'pending')
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 })
    }

    // Update the request status
    const status = action === 'accept' ? 'accepted' : 'rejected'
    const { error: updateError } = await supabase
      .from('cofounder_requests')
      .update({ status })
      .eq('id', request_id)

    if (updateError) {
      console.error('Error updating request:', updateError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    // If accepted, create notification for sender
    if (action === 'accept') {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: existingRequest.sender_id,
          type: 'cofounder_request_accepted',
          title: 'Co-founder Request Accepted!',
          body: 'Someone accepted your co-founder request',
          reference_id: user.id,
          reference_type: 'cofounder_request'
        })

      if (notificationError) {
        console.error('Error creating notification:', notificationError)
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/cofounder-match:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { request_id } = body

    if (!request_id) {
      return NextResponse.json({ error: 'request_id is required' }, { status: 400 })
    }

    // Delete the request where user is the sender - this ensures only requests you sent can be deleted
    const { error: deleteError } = await supabase
      .from('cofounder_requests')
      .delete()
      .eq('id', request_id)
      .eq('sender_id', user.id) // Explicit ownership verification - prevents deleting requests you didn't send

    if (deleteError) {
      console.error('Error deleting cofounder request:', deleteError)
      return NextResponse.json({ error: 'Failed to delete cofounder request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/cofounder-match:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
