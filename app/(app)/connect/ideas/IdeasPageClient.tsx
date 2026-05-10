'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import IdeasFeed from './IdeasFeed'
import CreateIdeaForm from './CreateIdeaForm'
import IdeaModal from './IdeaModal'
import { IdeaWithDetails } from '@/types/database'
import { useSupabase } from '@/components/SupabaseProvider'

export default function IdeasPageClient() {
  const { user, authLoading } = useSupabase()
  const [ideas, setIdeas] = useState<IdeaWithDetails[]>([])
  const [selectedIdea, setSelectedIdea] = useState<IdeaWithDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'public' | 'my'>('public')
  const supabase = createClient()


  // Load cached ideas on mount for instant display
  useEffect(() => {
    const cacheKey = `ideas_${activeTab}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached)
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setIdeas(data)
        }
      } catch (err) {
      }
    }
  }, [activeTab])

  useEffect(() => {
    if (user) {
      fetchIdeas()
    }
  }, [user, activeTab])

  const fetchIdeas = async (sort = 'latest') => {
    try {
      setError(null)
      // Remove setIdeasLoaded(false) - no blocking loading
      
      const tabParam = activeTab === 'my' ? '&myIdeas=true' : ''
      const response = await fetch(`/connect/ideas/api/ideas?sort=${sort}&userId=${user?.id}${tabParam}`)
      if (!response.ok) {
        throw new Error('Failed to fetch ideas')
      }
      
      const { data } = await response.json()
      const ideasData = data || []
      setIdeas(ideasData)
      
      // Cache the results for instant display on return
      const cacheKey = `ideas_${activeTab}`
      localStorage.setItem(cacheKey, JSON.stringify({
        data: ideasData,
        timestamp: Date.now()
      }))
      
      // Remove setIdeasLoaded(true) - no blocking loading
    } catch (err) {
      setError('Failed to load ideas')
      // Remove setIdeasLoaded(true) - no blocking loading
    }
  }

  const handleCreateIdea = async (ideaData: { title: string; content: string; is_public: boolean }) => {
    try {
      const response = await fetch('/connect/ideas/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ideaData),
      })

      if (!response.ok) {
        throw new Error('Failed to create idea')
      }

      const { data } = await response.json()
      setIdeas(prev => [data, ...prev])
    } catch (err) {
      throw err
    }
  }

  const handleIdeaClick = (idea: IdeaWithDetails) => {
    setSelectedIdea(idea)
    setIsModalOpen(true)
  }

  const handleIdeaUpdate = (updatedIdea: IdeaWithDetails) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === updatedIdea.id ? updatedIdea : idea
    ))
    if (selectedIdea?.id === updatedIdea.id) {
      setSelectedIdea(updatedIdea)
    }
  }

  const handleIdeaDelete = (ideaId: string) => {
    setIdeas(prev => prev.filter(idea => idea.id !== ideaId))
    if (selectedIdea?.id === ideaId) {
      setIsModalOpen(false)
      setSelectedIdea(null)
    }
  }

  const handleTabChange = (tab: 'public' | 'my') => {
    setActiveTab(tab)
  }

  if (authLoading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        padding: '40px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            width: '200px',
            height: '48px',
            background: 'var(--border)',
            borderRadius: '8px',
            animation: 'pulse 2s infinite',
            marginBottom: '24px'
          }} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div style={{
              background: 'var(--card)',
              borderRadius: '16px',
              padding: '32px',
              height: '400px'
            }} />
            <div style={{
              background: 'var(--card)',
              borderRadius: '16px',
              padding: '32px',
              height: '400px'
            }} />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        padding: '40px 24px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-2px', fontFamily: 'var(--font-display)', color: 'var(--text)', margin: 0, marginBottom: '8px' }}>
              Idea Board
            </h1>
            <div style={{ fontSize: '18px', fontWeight: '400', fontFamily: 'var(--font-body)', color: 'var(--text2)' }}>
              Share and discover startup ideas from the community
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Left side - Ideas feed */}
            <div style={{ background: 'var(--card)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '24px', letterSpacing: '-0.1px' }}>
                Community Ideas
              </h2>
              
              {/* Sign-in banner for posting ideas */}
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', fontFamily: 'var(--font-display)' }}>
                  Sign in to post your idea
                </div>
                <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>
                  Share your startup ideas with the community.
                </p>
                <a
                  href="/login"
                  style={{
                    display: 'inline-block',
                    padding: '12px 24px',
                    background: 'var(--green)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(21, 128, 61, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Sign In to Post
                </a>
              </div>
              
              {/* Public ideas placeholder */}
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text2)' }}>
                <div style={{ fontSize: '48px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                  💡
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '8px' }}>
                  Loading community ideas...
                </div>
                <p style={{ fontSize: '16px', color: 'var(--text2)' }}>
                  Sign in to see and interact with ideas from other founders.
                </p>
              </div>
            </div>

            {/* Right side - Sign-in prompt */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                  Join the Conversation
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '20px', lineHeight: '1.5' }}>
                  Sign in to post your own ideas, like and comment on others' posts, and build your startup network.
                </p>
                <a
                  href="/login"
                  style={{
                    display: 'block',
                    padding: '12px 24px',
                    background: 'var(--green)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(21, 128, 61, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Sign In to Participate
                </a>
              </div>
              
              {/* Features */}
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '24px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '16px' }}>
                  What You Can Do
                </h4>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text2)' }}>
                  <div style={{ marginBottom: '12px' }}>📝 Post your startup ideas</div>
                  <div style={{ marginBottom: '12px' }}>💬 Comment on others' ideas</div>
                  <div style={{ marginBottom: '12px' }}>👍 Like and support concepts</div>
                  <div>🤝 Connect with cofounders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px', color: 'var(--red)', fontFamily: 'var(--font-display)' }}>
          Error
        </h2>
        <p style={{ color: 'var(--text2)' }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="ideas-feed-container">
      {/* Left side - Ideas feed */}
      <div className="ideas-feed-main">
        <IdeasFeed
          ideas={ideas}
          onIdeaClick={handleIdeaClick}
          onIdeaUpdate={handleIdeaUpdate}
          onIdeaDelete={handleIdeaDelete}
          onSortChange={fetchIdeas}
          currentUserId={user.id}
          ideasLoaded={ideas.length > 0}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Right side - Create idea form */}
      <div className="ideas-feed-sidebar">
        <CreateIdeaForm onSubmit={handleCreateIdea} />
      </div>

      {/* Modal */}
      {isModalOpen && selectedIdea && (
        <IdeaModal
          idea={selectedIdea}
          onClose={() => setIsModalOpen(false)}
          onUpdate={handleIdeaUpdate}
          onDelete={handleIdeaDelete}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}
