'use client'

import { useState } from 'react'
import Link from 'next/link'
import { IdeaWithDetails, SortOption } from '@/types/database'

interface IdeasFeedProps {
  ideas: IdeaWithDetails[]
  onIdeaClick: (idea: IdeaWithDetails) => void
  onIdeaUpdate: (idea: IdeaWithDetails) => void
  onIdeaDelete: (ideaId: string) => void
  onSortChange: (sort: SortOption) => void
  currentUserId: string
  ideasLoaded: boolean
  activeTab: 'public' | 'my'
  onTabChange: (tab: 'public' | 'my') => void
}

export default function IdeasFeed({ 
  ideas, 
  onIdeaClick, 
  onIdeaUpdate, 
  onIdeaDelete, 
  onSortChange,
  currentUserId,
  ideasLoaded,
  activeTab,
  onTabChange
}: IdeasFeedProps) {
  const [currentSort, setCurrentSort] = useState<SortOption>('latest')

  const handleSortChange = (sort: SortOption) => {
    setCurrentSort(sort)
    onSortChange(sort)
  }

  const formatTimeAgo = (dateString: string) => {
    // Fix: Append Z to ensure UTC parsing if not already present
    const timestamp = dateString.endsWith('Z') ? dateString : dateString + 'Z'
    const date = new Date(timestamp)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInSeconds / 3600)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInSeconds / 86400)
    if (diffInDays <= 6) return `${diffInDays} days ago`
    
    const diffInWeeks = Math.floor(diffInSeconds / 604800)
    if (diffInWeeks <= 4) return `${diffInWeeks} weeks ago`
    
    const diffInMonths = Math.floor(diffInSeconds / 2592000)
    if (diffInMonths <= 11) return `${diffInMonths} months ago`
    
    const diffInYears = Math.floor(diffInSeconds / 31536000)
    return `${diffInYears} years ago`
  }

  const truncateContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const handleDelete = async (ideaId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/connect/ideas/api/ideas/${ideaId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete idea')
      }

      onIdeaDelete(ideaId)
    } catch (err) {
      console.error('Error deleting idea:', err)
      alert('Failed to delete idea. Please try again.')
    }
  }

  const handleEdit = (idea: IdeaWithDetails, e: React.MouseEvent) => {
    e.stopPropagation()
    onIdeaClick(idea)
  }

  return (
    <div>
      {/* Tab row - Distinct tabs */}
      <div style={{
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '4px',
          width: 'fit-content',
        }}>
          <button
            onClick={() => onTabChange('public')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'public' ? 'var(--green)' : 'transparent',
              color: activeTab === 'public' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.2s',
              letterSpacing: '-0.1px'
            }}
          >
            Public
          </button>
          <button
            onClick={() => onTabChange('my')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'my' ? 'var(--green)' : 'transparent',
              color: activeTab === 'my' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.2s',
              letterSpacing: '-0.1px'
            }}
          >
            My Ideas
          </button>
        </div>
      </div>

      {/* Filter row - Pill buttons */}
      <div style={{
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <span style={{
            fontSize: '13px',
            color: 'var(--text2)',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            marginRight: '8px'
          }}>
            Sort by:
          </span>
          <button
            onClick={() => handleSortChange('latest')}
            style={{
              padding: '6px 14px',
              background: currentSort === 'latest' ? 'var(--green)' : 'var(--card)',
              color: currentSort === 'latest' ? 'white' : 'var(--text)',
              border: currentSort === 'latest' ? '1px solid var(--green)' : '1px solid var(--border)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.2s',
            }}
          >
            Latest
          </button>
          <button
            onClick={() => handleSortChange('most_liked')}
            style={{
              padding: '6px 14px',
              background: currentSort === 'most_liked' ? 'var(--green)' : 'var(--card)',
              color: currentSort === 'most_liked' ? 'white' : 'var(--text)',
              border: currentSort === 'most_liked' ? '1px solid var(--green)' : '1px solid var(--border)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              transition: 'all 0.2s',
            }}
          >
            Most Liked
          </button>
        </div>
      </div>

      {/* Ideas grid */}
      {ideasLoaded && ideas.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '12px',
            fontFamily: 'var(--font-display)',
            color: 'var(--text)',
          }}>
            No ideas yet
          </h3>
          <p style={{ color: 'var(--text2)', fontSize: '16px' }}>
            Be the first to post an idea!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
        }}>
          {ideasLoaded && ideas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => onIdeaClick(idea)}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--green)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Owner controls */}
              {idea.user_id === currentUserId && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  gap: '8px',
                }}>
                  <button
                    onClick={(e) => handleEdit(idea, e)}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--blue)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(idea.id, e)}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--red)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}

              {/* Title */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  marginBottom: '8px',
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text)',
                  lineHeight: 1.3,
                  paddingRight: idea.user_id === currentUserId ? '100px' : '0',
                }}>
                  {idea.title}
                </h3>
              </div>

              {/* Content preview */}
              <p style={{
                fontSize: '14px',
                color: 'var(--text2)',
                marginBottom: '16px',
                lineHeight: 1.5,
              }}>
                {truncateContent(idea.content)}
              </p>

              {/* Author */}
              <div style={{ marginBottom: '12px' }}>
                <Link
                  href={`/profile/${idea.profiles.username}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: '13px',
                    color: 'var(--blue)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  @{idea.profiles.username}
                </Link>
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                fontSize: '13px',
                color: 'var(--text3)',
              }}>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>👍</span>
                    <span>{idea._count?.idea_likes || 0}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>💬</span>
                    <span>{idea._count?.idea_comments || 0}</span>
                  </div>
                  <div>
                    {formatTimeAgo(idea.created_at)}
                  </div>
                </div>
                
                {/* Public/Private badge for My Ideas tab */}
                {activeTab === 'my' && (
                  <span style={{
                    background: idea.is_public ? 'var(--green)' : 'var(--text3)',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-body)',
                    textTransform: 'uppercase',
                  }}>
                    {idea.is_public ? 'Public' : 'Private'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
