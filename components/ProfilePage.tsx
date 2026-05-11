'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import CountryDropdown, { countries } from './CountryDropdown'
import 'flag-icons/css/flag-icons.min.css'

interface Profile {
  id: string
  username: string
  country?: string
  bio?: string
  project_stage?: string
  skills?: string[]
  status_tags?: string[]
  twitter?: string
  linkedin?: string
  is_teacher?: boolean
  created_at: string
}

interface UserStats {
  elo?: number
  rank?: string
  weekly_duel_entered?: number
}

interface Idea {
  id: string
  title: string
  content: string
  created_at: string
}

interface DailyStreak {
  current_streak: number
  longest_streak: number
  last_submission_date: string | null
}

interface ProfilePageProps {
  profile: Profile
  userStats?: UserStats
  ideas: Idea[]
  isOwnProfile: boolean
  allTimeRank?: number | null
  dailyRank?: number | null
  weeklyDuelsCount?: number
  hasEnteredCurrentDuel?: boolean
  dailyStreak?: DailyStreak | null
}

export default function ProfilePage({ profile: initialProfile, userStats, ideas, isOwnProfile, allTimeRank, dailyRank, weeklyDuelsCount, hasEnteredCurrentDuel, dailyStreak }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(initialProfile)
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | 'invalid' | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    username: initialProfile.username || '',
    country: initialProfile.country || '',
    bio: initialProfile.bio || '',
    project_stage: initialProfile.project_stage || '',
    skills: initialProfile.skills || [],
    status_tags: initialProfile.status_tags || [],
    twitter: initialProfile.twitter || '',
    linkedin: initialProfile.linkedin || ''
  })

  // Classes state
  const [userClass, setUserClass] = useState<any>(null)
  const [teacherClasses, setTeacherClasses] = useState<any[]>([])
  const [classesLoading, setClassesLoading] = useState(false)

  const supabase = createClient()

  // Fetch classes data
  useEffect(() => {
    fetchClassesData()
  }, [currentProfile])

  const fetchClassesData = async () => {
    if (!currentProfile?.id) return
    
    setClassesLoading(true)
    try {
      if (currentProfile.is_teacher) {
        // Fetch teacher's classes
        const { data: classes } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', currentProfile.id)
          .order('created_at', { ascending: false })
        
        setTeacherClasses(classes || [])
      } else {
        // Check if user is in a class as a student
        const { data: classMember } = await supabase
          .from('class_members')
          .select('*, classes(*)')
          .eq('user_id', currentProfile.id)
          .maybeSingle()
        
        if (classMember?.classes) {
          setUserClass(classMember.classes)
        }
      }
    } catch (error) {
    } finally {
      setClassesLoading(false)
    }
  }

  // Check username availability in real-time
  useEffect(() => {
    if (!isEditing || !editData.username.trim()) {
      setUsernameStatus(null)
      setUsernameError(null)
      return
    }

    // Skip validation if username hasn't changed
    if (editData.username.trim() === currentProfile.username) {
      setUsernameStatus(null)
      setUsernameError(null)
      return
    }

    // Validate username rules
    const validationRules = [
      {
        test: editData.username.length >= 3 && editData.username.length <= 20,
        message: 'Username must be 3-20 characters'
      },
      {
        test: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(editData.username),
        message: 'Username must start with a letter and contain only letters, numbers, and underscores'
      }
    ]

    const failedRule = validationRules.find(rule => !rule.test)
    if (failedRule) {
      setUsernameStatus('invalid')
      setUsernameError(failedRule.message)
      return
    }

    setUsernameError(null)

    const checkUsername = async () => {
      setUsernameStatus('checking')
      
      try {
        const response = await fetch(`/api/check-username?username=${encodeURIComponent(editData.username.trim().toLowerCase())}`)
        const result = await response.json()

        if (!response.ok) {
          setUsernameStatus('invalid')
          setUsernameError(result.error || 'Failed to check username availability')
          return
        }

        setUsernameStatus(result.available ? 'available' : 'taken')
      } catch (err) {
        setUsernameStatus('invalid')
        setUsernameError('Failed to check username availability')
      }
    }

    const timeoutId = setTimeout(checkUsername, 300)
    return () => clearTimeout(timeoutId)
  }, [editData.username, isEditing, currentProfile.username])

  useEffect(() => {
    // Reset edit data when entering edit mode
    if (isEditing) {
      setEditData({
        username: currentProfile.username || '',
        country: currentProfile.country || '',
        bio: currentProfile.bio || '',
        project_stage: currentProfile.project_stage || '',
        skills: currentProfile.skills || [],
        status_tags: currentProfile.status_tags || [],
        twitter: currentProfile.twitter || '',
        linkedin: currentProfile.linkedin || '',
      })
    }
  }, [isEditing, currentProfile])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Always validate username regex before submitting
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/
    if (!usernameRegex.test(editData.username.trim())) {
      alert('Username must start with a letter and contain only letters, numbers, and underscores. No spaces or special characters.')
      return
    }
    
    if (!currentProfile?.id) {
      alert('No profile ID found')
      return
    }

    // Validate username if it changed
    if (editData.username.trim() !== currentProfile.username) {
      if (usernameStatus !== 'available') {
        alert('Please choose a valid and available username')
        return
      }
    }
    
    try {
      const response = await fetch(`/profile/${currentProfile.username}/api/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editData.username,
          country: editData.country,
          bio: editData.bio,
          project_stage: editData.project_stage,
          skills: editData.skills,
          status_tags: editData.status_tags,
          twitter: editData.twitter,
          linkedin: editData.linkedin
        })
      })

      const result = await response.json()

      if (!response.ok) {
        alert(`Error saving profile: ${result.error}`)
        return
      }

      // Update local state
      setCurrentProfile(prev => ({
        ...prev,
        username: editData.username,
        country: editData.country,
        bio: editData.bio,
        project_stage: editData.project_stage,
        skills: editData.skills,
        status_tags: editData.status_tags,
        twitter: editData.twitter,
        linkedin: editData.linkedin
      }))
      
      // Scroll to top after successful save
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      setIsEditing(false)
    } catch (error) {
      alert('Error saving profile. Please try again.')
    }
  }

  const toggleSkill = (skill: string) => {
    setEditData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const toggleStatusTag = (tag: string) => {
    setEditData(prev => ({
      ...prev,
      status_tags: prev.status_tags.includes(tag)
        ? prev.status_tags.filter(t => t !== tag)
        : [...prev.status_tags, tag]
    }))
  }

  const getProfileColor = (username: string) => {
    const colors = ['#16a34a', '#2563eb', '#7c3aed', '#dc2626', '#ca8a04']
    let hash = 0
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const getCountryFlag = (countryCode?: string) => {
    if (!countryCode) return null
    
    // Handle common abbreviations
    const codeMap: { [key: string]: string } = {
      'USA': 'US',
      'UK': 'GB', 
      'UAE': 'AE',
      'USSR': 'RU'
    }
    
    const normalizedCode = codeMap[countryCode.toUpperCase()] || countryCode.toUpperCase()
    return normalizedCode
  }

  const getRankByElo = (elo?: number) => {
    if (!elo) return 'Builder'
    
    if (elo < 500) return 'Trainee'
    if (elo >= 500 && elo < 750) return 'Builder'
    if (elo >= 750 && elo < 1000) return 'Creator'
    if (elo >= 1000 && elo < 1250) return 'Founder'
    if (elo >= 1250 && elo < 1500) return 'Visionary'
    if (elo >= 1500 && elo < 1750) return 'Icon'
    if (elo >= 1750 && elo < 2000) return 'Titan'
    return 'Unicorn'
  }

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Trainee': return '#9ca3af' // grey
      case 'Builder': return '#2563eb' // blue
      case 'Creator': return '#16a34a' // green
      case 'Founder': return '#ca8a04' // gold
      case 'Visionary': return '#7c3aed' // purple
      case 'Icon': return '#ea580c' // orange
      case 'Titan': return '#dc2626' // red
      case 'Unicorn': return 'linear-gradient(135deg, #7c3aed, #ec4899, #10b981)' // rainbow gradient
      default: return '#9ca3af'
    }
  }

  const stageOptions = ['Just an Idea', 'Building MVP', 'Launched', 'Growing', 'Scaling']
  const skillOptions = ['Design', 'Marketing', 'Finance', 'Engineering', 'Sales', 'Product', 'Operations', 'Legal', 'Data', 'AI/ML', 'Web Dev', 'Mobile Dev', 'Blockchain', 'Content', 'Video', 'Photography', 'Music', 'Writing', 'Research', 'Consulting']

  // Edit Mode
  if (isEditing) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'var(--bg)',
        backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        padding: '40px 24px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            background: 'var(--card)', 
            borderRadius: '16px', 
            padding: '48px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)'
          }}>
            <h2 style={{ marginBottom: '32px', color: 'var(--text)' }}>Edit Profile</h2>
            
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Username */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '500' }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData(prev => ({ ...prev, username: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'var(--bg)',
                      color: 'var(--text)'
                    }}
                    required
                  />
                  {usernameStatus && (
                    <div style={{ marginTop: '8px', fontSize: '14px' }}>
                      {usernameStatus === 'available' && <span style={{ color: '#16a34a' }}>✓ Username available</span>}
                      {usernameStatus === 'taken' && <span style={{ color: '#dc2626' }}>✗ Username taken</span>}
                      {usernameStatus === 'invalid' && <span style={{ color: '#dc2626' }}>✗ Invalid username</span>}
                    </div>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '500' }}>
                    Country
                  </label>
                  <CountryDropdown
                    value={editData.country}
                    onChange={(value) => setEditData(prev => ({ ...prev, country: value }))}
                  />
                </div>

                {/* Bio */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '500' }}>
                    Bio
                  </label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Stage */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '500' }}>
                    Project Stage
                  </label>
                  <select
                    value={editData.project_stage}
                    onChange={(e) => setEditData(prev => ({ ...prev, project_stage: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'var(--bg)',
                      color: 'var(--text)'
                    }}
                  >
                    <option value="">Select stage</option>
                    {stageOptions.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>

                {/* Skills */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '500' }}>
                    Skills
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {skillOptions.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        style={{
                          padding: '8px 16px',
                          border: editData.skills.includes(skill) ? '1px solid var(--primary)' : '1px solid var(--border)',
                          borderRadius: '20px',
                          background: editData.skills.includes(skill) ? 'var(--primary)' : 'var(--bg)',
                          color: editData.skills.includes(skill) ? 'white' : 'var(--text)',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Tags */}
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '500' }}>
                    Status Tags
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['Looking for cofounder', 'Open to collaborate', 'Hiring', 'Seeking funding'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleStatusTag(tag)}
                        style={{
                          padding: '8px 16px',
                          border: editData.status_tags.includes(tag) ? '1px solid var(--primary)' : '1px solid var(--border)',
                          borderRadius: '20px',
                          background: editData.status_tags.includes(tag) ? 'var(--primary)' : 'var(--bg)',
                          color: editData.status_tags.includes(tag) ? 'white' : 'var(--text)',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Social Links */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '500' }}>
                      Twitter
                    </label>
                    <input
                      type="text"
                      value={editData.twitter}
                      onChange={(e) => setEditData(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="@username"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        background: 'var(--bg)',
                        color: 'var(--text)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text)', fontWeight: '500' }}>
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      value={editData.linkedin}
                      onChange={(e) => setEditData(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="linkedin.com/in/username"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        background: 'var(--bg)',
                        color: 'var(--text)'
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '32px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    style={{
                      padding: '12px 24px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'var(--bg)',
                      color: 'var(--text)',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-button"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Normal View
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)',
      backgroundImage: 'linear-gradient(rgba(21,128,61,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(21,128,61,.065) 1px, transparent 1px)',
      backgroundSize: '48px 48px',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* TOP SECTION - Full Width Header */}
        <div style={{ 
          background: 'var(--card)', 
          borderRadius: '16px', 
          padding: '48px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          marginBottom: '32px',
          position: 'relative'
        }}>
          {/* Edit Profile Button - Top Right */}
          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-cta-ghost"
              style={{
                position: 'absolute',
                top: '48px',
                right: '48px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              Edit Profile
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '40px', justifyContent: 'space-between' }}>
            {/* Left: Profile Circle and Info */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flex: 1 }}>
              {/* Profile Circle */}
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${getProfileColor(currentProfile.username)}, ${getProfileColor(currentProfile.username)}dd)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '56px',
                fontWeight: '800',
                fontFamily: 'var(--font-display)',
                flexShrink: 0,
                boxShadow: 'var(--shadow-lg)',
                border: '4px solid var(--card)',
                position: 'relative',
                zIndex: 1
              }}>
                {currentProfile.username.charAt(0)}
              </div>

              {/* Profile Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Username and Stage */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <h1 style={{ 
                    fontSize: '42px', 
                    fontWeight: '800', 
                    fontFamily: 'var(--font-display)', 
                    color: 'var(--text)', 
                    margin: 0,
                    letterSpacing: '-0.5px'
                  }}>
                    {currentProfile.username}
                  </h1>
                  {currentProfile.project_stage && (
                    <span style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      background: 'var(--green)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '700',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.5px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {currentProfile.project_stage}
                    </span>
                  )}
                </div>

                {/* Location */}
                {currentProfile.country && (
                  <div style={{ 
                    fontSize: '16px', 
                    color: 'var(--text2)', 
                    marginBottom: '16px',
                    fontWeight: '600',
                    fontFamily: 'var(--font-body)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {getCountryFlag(currentProfile.country) && (
                      <span className={`fi fi-${getCountryFlag(currentProfile.country)!.toLowerCase()}`}></span>
                    )}
                    {countries.find(c => c.code === currentProfile.country)?.name || currentProfile.country}
                  </div>
                )}

                {/* Bio */}
                {currentProfile.bio && (
                  <p style={{ 
                    fontSize: '16px', 
                    lineHeight: '1.6', 
                    color: 'var(--text)', 
                    marginBottom: '24px',
                    fontFamily: 'var(--font-body)',
                    fontWeight: '500'
                  }}>
                    {currentProfile.bio}
                  </p>
                )}

                {/* Skills and Status Tags */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Skills */}
                  {currentProfile.skills && currentProfile.skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {currentProfile.skills.map(skill => (
                        <span 
                          key={skill}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            background: 'var(--blue-tint)',
                            color: 'var(--blue)',
                            fontSize: '13px',
                            fontWeight: '700',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '0.3px',
                            border: '1px solid var(--blue)',
                            transition: 'all 0.2s ease',
                            cursor: 'default'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Status Tags */}
                  {currentProfile.status_tags && currentProfile.status_tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {currentProfile.status_tags.map(tag => (
                        <span 
                          key={tag}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            background: 'var(--purple-tint)',
                            color: 'var(--purple)',
                            fontSize: '13px',
                            fontWeight: '700',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '0.3px',
                            border: '1px solid var(--purple)',
                            transition: 'all 0.2s ease',
                            cursor: 'default'
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links - Bottom Right */}
            {(currentProfile.twitter || currentProfile.linkedin) && (
              <div style={{ 
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                display: 'flex', 
                gap: '12px',
                alignItems: 'center'
              }}>
                {currentProfile.twitter && (
                  <a 
                    href={`https://x.com/${currentProfile.twitter}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--card2)',
                      border: '1px solid var(--border2)',
                      color: 'var(--text2)',
                      textDecoration: 'none',
                      fontSize: '18px',
                      fontWeight: '700',
                      transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#000'
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.borderColor = '#000'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = 'var(--shadow)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--card2)'
                      e.currentTarget.style.color = 'var(--text2)'
                      e.currentTarget.style.borderColor = 'var(--border2)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    }}
                  >
                    𝕏
                  </a>
                )}
                {currentProfile.linkedin && (
                  <a 
                    href={`https://linkedin.com/in/${currentProfile.linkedin}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--card2)',
                      border: '1px solid var(--border2)',
                      color: 'var(--text2)',
                      textDecoration: 'none',
                      fontSize: '18px',
                      fontWeight: '700',
                      transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0077b5'
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.borderColor = '#0077b5'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = 'var(--shadow)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--card2)'
                      e.currentTarget.style.color = 'var(--text2)'
                      e.currentTarget.style.borderColor = 'var(--border2)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    }}
                  >
                    in
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '32px', 
          marginBottom: '32px'
        }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', justifyContent: 'space-between' }}>
            {/* ELO and Rank Card */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              width: '100%'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ 
                  fontSize: '64px', 
                  fontWeight: '800', 
                  color: 'var(--green)', 
                  fontFamily: 'var(--font-display)',
                  marginBottom: '8px'
                }}>
                  {userStats?.elo || 0}
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--text2)', 
                  fontFamily: 'var(--font-display)',
                  marginBottom: '16px'
                }}>
                  ELO Rating
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  fontFamily: 'var(--font-display)',
                  color: getRankColor(getRankByElo(userStats?.elo)),
                  marginBottom: '8px'
                }}>
                  {getRankByElo(userStats?.elo)}
                </div>
              </div>

              {/* Rank Information */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                paddingTop: '24px',
                borderTop: '1px solid var(--border2)'
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>All-Time Rank</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    #{allTimeRank || 'N/A'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>Daily Rank</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    #{dailyRank || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Streak Card */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              width: '100%'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                fontFamily: 'var(--font-display)',
                color: 'var(--text)'
              }}>
                Daily Battle Streak
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>Current Streak 🔥</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    {dailyStreak?.current_streak || 0} days
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '4px' }}>Longest Streak</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                    {dailyStreak?.longest_streak || 0} days
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Duels Entered Card */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              width: '100%',
              flex: 1
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                fontFamily: 'var(--font-display)',
                color: 'var(--text)'
              }}>
                Weekly Duels Entered
              </h3>
              
              <div style={{
                textAlign: 'center',
                padding: '40px 0'
              }}>
                <div style={{
                  fontSize: '64px',
                  fontWeight: '800',
                  color: 'var(--green)',
                  fontFamily: 'var(--font-display)',
                  marginBottom: '16px'
                }}>
                  {weeklyDuelsCount || 0}
                </div>
                
                {hasEnteredCurrentDuel ? (
                  <div style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: 'var(--green)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '700',
                    fontFamily: 'var(--font-display)'
                  }}>
                    Entered the current weekly duel
                  </div>
                ) : (
                  <div style={{
                    display: 'inline-block',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: 'var(--card2)',
                    color: 'var(--text2)',
                    fontSize: '14px',
                    fontWeight: '700',
                    fontFamily: 'var(--font-display)',
                    border: '1px solid var(--border2)'
                  }}>
                    not entered the current weekly duel
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
            {/* Ideas Card */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              width: '100%'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                fontFamily: 'var(--font-display)',
                color: 'var(--text)'
              }}>
                Ideas ({ideas.length})
              </h3>
              
              {ideas.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {ideas.slice(0, 3).map(idea => (
                    <a 
                      key={idea.id}
                      href="/create/ideas"
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'var(--card2)',
                        border: '1px solid var(--border2)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        display: 'block'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.border = '1px solid var(--green)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border = '1px solid var(--border2)'
                      }}
                    >
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: 'var(--text)',
                        fontFamily: 'var(--font-display)'
                      }}>
                        {idea.title}
                      </h4>
                      <p style={{
                        fontSize: '14px',
                        color: 'var(--text2)',
                        lineHeight: '1.5',
                        marginBottom: '8px'
                      }}>
                        {idea.content.length > 150 ? idea.content.substring(0, 150) + '...' : idea.content}
                      </p>
                      <div style={{
                        fontSize: '12px',
                        color: 'var(--text2)',
                        fontFamily: 'var(--font-body)'
                      }}>
                        {new Date(idea.created_at).toLocaleDateString()}
                      </div>
                    </a>
                  ))}
                  {ideas.length > 3 && (
                    <div style={{
                      textAlign: 'center',
                      paddingTop: '16px'
                    }}>
                      <a 
                        href="/create/ideas"
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--border2)',
                          background: 'var(--card2)',
                          color: 'var(--text)',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          display: 'inline-block'
                        }}
                      >
                        View All Ideas
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'var(--text2)'
                }}>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>
                    {isOwnProfile ? 'No ideas yet' : 'No public ideas yet'}
                  </div>
                  <div style={{ fontSize: '14px' }}>
                    {isOwnProfile ? 'Start sharing your brilliant ideas!' : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Classes Card */}
            {(currentProfile.is_teacher || userClass) && (
              <div style={{ 
                background: 'var(--card)', 
                borderRadius: '16px', 
                padding: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow)',
                width: '100%'
              }}>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  marginBottom: '20px', 
                  fontFamily: 'var(--font-display)',
                  color: 'var(--text)'
                }}>
                  Classes
                </h3>
                
                {classesLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text2)' }}>
                    Loading classes...
                  </div>
                ) : currentProfile.is_teacher ? (
                  teacherClasses.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {teacherClasses.map((classItem) => (
                        <div key={classItem.id} style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '16px'
                        }}>
                          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                            {classItem.name}
                          </div>
                          <div style={{ fontSize: '14px', color: 'var(--text2)' }}>
                            {classItem.student_count} students{classItem.school_name && classItem.school_name.trim() ? ` · ${classItem.school_name}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text2)' }}>
                      No classes yet
                    </div>
                  )
                ) : userClass ? (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                      {userClass.name}
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text2)' }}>
                      Teacher: {userClass.teacher_name || 'Unknown'}{userClass.school_name && userClass.school_name.trim() ? ` · ${userClass.school_name}` : ''}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text2)' }}>
                    Not in any class yet
                  </div>
                )}
              </div>
            )}

            {/* Member Since Card */}
            <div style={{ 
              background: 'var(--card)', 
              borderRadius: '16px', 
              padding: '32px',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow)',
              width: '100%'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: '700', 
                marginBottom: '20px', 
                fontFamily: 'var(--font-display)',
                color: 'var(--text)'
              }}>
                Member Since
              </h3>
              
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text)',
                fontFamily: 'var(--font-display)',
                lineHeight: '1.4'
              }}>
                {new Date(currentProfile.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
