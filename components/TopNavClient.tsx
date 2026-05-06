'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { signOut } from '@/app/actions/auth'
import { useTheme } from '@/components/ThemeProvider'

export default function TopNavClient({
  user,
  forceLoggedOut,
}: {
  user: { email?: string | null; name?: string | null; username?: string | null } | null
  forceLoggedOut?: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState<'connect' | 'compete' | 'settings' | null>(null)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  // Helper function to check if a route is active
  const isActiveRoute = (route: string) => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(route)
  }

  // Helper function to get active style
  const getActiveStyle = (route: string, baseStyle: React.CSSProperties) => {
    if (isActiveRoute(route)) {
      return {
        ...baseStyle,
        background: 'var(--green)',
        color: 'white',
        fontWeight: 800
      }
    }
    return baseStyle
  }

  const menuItemStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: 'var(--text2)',
    padding: '7px 14px',
    borderRadius: '7px',
    fontSize: '14px',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    transition: 'all .15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }

  const menuItemHoverStyle: React.CSSProperties = {
    outline: '2px solid var(--green)',
    outlineOffset: '2px',
    fontWeight: 700,
  }

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    minWidth: '220px',
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-lg)',
    padding: '8px',
    zIndex: 200,
    transformOrigin: 'top left',
    transition: 'opacity .16s ease, transform .16s ease',
  }

  const dropdownLinkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 10px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'var(--text2)',
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  }

  const dropdownLinkHoverStyle: React.CSSProperties = {
    outline: '2px solid var(--green)',
    outlineOffset: '2px',
    fontWeight: 700,
  }

  const isLoggedIn = Boolean(user) && !forceLoggedOut
  const isOnLanding = pathname === '/'

  const scrollToLandingSection = (id: string, align: 'center' | 'top') => {
    if (!isOnLanding) {
      router.push(`/#${id}`)
      return
    }
    const el = document.getElementById(id)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const navOffset = 76
    const targetTop =
      align === 'center'
        ? rect.top + window.scrollY - (window.innerHeight / 2 - rect.height / 2)
        : rect.top + window.scrollY - navOffset
    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
  }

  
  const hoverZoneStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    paddingBottom: '10px',
    marginBottom: '-10px',
  }

  const handleNavPageClick = () => {
    setOpen(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className="nav">
      <Link
        className="nav-brand"
        href={user ? "/dashboard" : "/"}
        prefetch={user ? true : false}
        onClick={(e) => {
          if (isOnLanding) {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }}
        style={{ textDecoration: 'none' }}
      >
        <div className="nav-logo">B</div>
        <span className="nav-name">BizYip</span>
      </Link>

      {/* Mobile Hamburger Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '8px',
          color: 'var(--text)',
          marginRight: '16px'
        }}
        className="mobile-menu-toggle"
      >
        {mobileMenuOpen ? '×' : '⋯'}
      </button>

      {/* Mobile Menu Container */}
      <div className={`mobile-menu-container ${mobileMenuOpen ? '' : 'hidden'}`} style={{
        position: 'fixed',
        top: '68px',
        left: 0,
        right: 0,
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        zIndex: 90,
        maxHeight: 'calc(100vh - 68px)',
        overflowY: 'auto'
      }}>
        {/* Mobile Connect Section */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: 'var(--green)', 
            marginBottom: '12px',
            fontFamily: 'var(--font-display)'
          }}>
            Connect
          </div>
          {isLoggedIn ? (
            <>
              <Link 
                href="/connect/cofounder-match" 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  marginBottom: '8px',
                  ...(hoveredItem === 'cofounder-match' ? dropdownLinkHoverStyle : {})
                }} 
                onClick={() => {
                  handleNavPageClick()
                  setMobileMenuOpen(false)
                }}
                onMouseEnter={() => setHoveredItem('cofounder-match')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                Co-founder Match
              </Link>
                            <Link 
                href="/connect/ideas" 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  ...(hoveredItem === 'ideas' ? dropdownLinkHoverStyle : {})
                }} 
                onClick={() => {
                  handleNavPageClick()
                  setMobileMenuOpen(false)
                }}
                onMouseEnter={() => setHoveredItem('ideas')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                Ideas
              </Link>
            </>
          ) : (
            <a
              href="/#connect"
              onClick={(e) => {
                e.preventDefault()
                scrollToLandingSection('connect', 'center')
                setMobileMenuOpen(false)
              }}
              style={dropdownLinkStyle}
            >
              Connect
            </a>
          )}
        </div>

        {/* Mobile Compete Section */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: 'var(--green)', 
            marginBottom: '12px',
            fontFamily: 'var(--font-display)'
          }}>
            Compete
          </div>
          {isLoggedIn ? (
            <>
              <Link 
                href="/1v1" 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  marginBottom: '8px',
                  ...(hoveredItem === '1v1' ? dropdownLinkHoverStyle : {})
                }} 
                onClick={() => {
                  handleNavPageClick()
                  setMobileMenuOpen(false)
                }}
                onMouseEnter={() => setHoveredItem('1v1')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                1v1 Battles
              </Link>
              <Link 
                href="/compete/daily-battle" 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  marginBottom: '8px',
                  ...(hoveredItem === 'daily-battle' ? dropdownLinkHoverStyle : {})
                }} 
                onClick={() => {
                  handleNavPageClick()
                  setMobileMenuOpen(false)
                }}
                onMouseEnter={() => setHoveredItem('daily-battle')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                Daily Battle
              </Link>
              <Link 
                href="/compete/weekly-duel" 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  marginBottom: '8px',
                  ...(hoveredItem === 'weekly-duel' ? dropdownLinkHoverStyle : {})
                }} 
                onClick={() => {
                  handleNavPageClick()
                  setMobileMenuOpen(false)
                }}
                onMouseEnter={() => setHoveredItem('weekly-duel')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                Weekly Duel
              </Link>
              <Link 
                href="/compete/leaderboard" 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  ...(hoveredItem === 'leaderboard' ? dropdownLinkHoverStyle : {})
                }} 
                onClick={() => {
                  handleNavPageClick()
                  setMobileMenuOpen(false)
                }}
                onMouseEnter={() => setHoveredItem('leaderboard')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                Leaderboard
              </Link>
            </>
          ) : (
            <a
              href="/#compete"
              onClick={(e) => {
                e.preventDefault()
                scrollToLandingSection('compete', 'center')
                setMobileMenuOpen(false)
              }}
              style={dropdownLinkStyle}
            >
              Compete
            </a>
          )}
        </div>

        
        {/* Mobile Login/Signup Section */}
        <div style={{ padding: '16px' }}>
          {user ? (
            <>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '700', 
                color: 'var(--text2)', 
                marginBottom: '12px',
                fontFamily: 'var(--font-display)'
              }}>
                {user.name ?? user.email ?? 'Account'}
              </div>
              <Link 
                href={user.username ? `/profile/${user.username}` : "/profile"} 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  marginBottom: '8px'
                }} 
                onClick={() => {
                  handleNavPageClick()
                  setMobileMenuOpen(false)
                }}
              >
                Profile
              </Link>
              <Link 
                href="/settings" 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  marginBottom: '8px'
                }} 
                onClick={() => {
                  handleNavPageClick()
                  setMobileMenuOpen(false)
                }}
              >
                Settings
              </Link>
              <form action={signOut} onSubmit={() => setMobileMenuOpen(false)}>
                <button
                  type="submit"
                  style={{
                    ...dropdownLinkStyle,
                    width: '100%',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: '12px'
                  }}
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link 
                href="/login?mode=login" 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  marginBottom: '8px',
                  border: '1px solid var(--border)',
                  textAlign: 'center'
                }} 
                onClick={() => {
                  setMobileMenuOpen(false)
                }}
              >
                Log In
              </Link>
              <Link 
                href="/login?mode=signup" 
                prefetch={true}
                style={{
                  ...dropdownLinkStyle,
                  display: 'block',
                  background: 'var(--green)',
                  color: 'white',
                  textAlign: 'center'
                }} 
                onClick={() => {
                  setMobileMenuOpen(false)
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="nav-links" style={{ position: 'relative' }}>
        <div
          style={hoverZoneStyle}
          onMouseEnter={() => setOpen('connect')}
          onMouseLeave={() => setOpen(null)}
        >
          {isLoggedIn ? (
            <span 
              className="topnav-link" 
              style={{ 
                ...menuItemStyle, 
                cursor: 'default',
                ...(open === 'connect' ? menuItemHoverStyle : {}),
                ...(isActiveRoute('/connect') ? { background: 'var(--green)', color: 'white', fontWeight: 800 } : {})
              }}
            >
              Connect
            </span>
          ) : (
            <a
              className="topnav-link"
              href="/#connect"
              onClick={(e) => {
                e.preventDefault()
                scrollToLandingSection('connect', 'center')
              }}
              style={{
                ...menuItemStyle,
                ...(hoveredItem === 'connect' ? menuItemHoverStyle : {}),
                ...(isActiveRoute('/connect') ? { background: 'var(--green)', color: 'white', fontWeight: 800 } : {})
              }}
              onMouseEnter={() => setHoveredItem('connect')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              Connect
            </a>
          )}
          <div
            style={{
              ...dropdownStyle,
              opacity: open === 'connect' ? 1 : 0,
              transform:
                open === 'connect'
                  ? 'translateY(0) scale(1)'
                  : 'translateY(-4px) scale(.98)',
              pointerEvents: open === 'connect' ? 'auto' : 'none',
            }}
          >
            <Link 
              href={isLoggedIn ? "/connect/cofounder-match" : "/login?mode=signup"} 
              prefetch={isLoggedIn ? true : false}
              className="topnav-dropdown-link" 
              style={getActiveStyle('/connect/cofounder-match', {
                ...dropdownLinkStyle, 
                ...(hoveredItem === 'cofounder-match' ? dropdownLinkHoverStyle : {})
              })} 
              onClick={handleNavPageClick}
              onMouseEnter={() => setHoveredItem('cofounder-match')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              Co-founder Match
            </Link>
                        <Link 
              href={isLoggedIn ? "/connect/ideas" : "/login?mode=signup"} 
              prefetch={isLoggedIn ? true : false}
              className="topnav-dropdown-link" 
              style={getActiveStyle('/connect/ideas', {
                ...dropdownLinkStyle, 
                ...(hoveredItem === 'ideas' ? dropdownLinkHoverStyle : {})
              })} 
              onClick={handleNavPageClick}
              onMouseEnter={() => setHoveredItem('ideas')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              Ideas
            </Link>
          </div>
        </div>

        <div
          style={hoverZoneStyle}
          onMouseEnter={() => setOpen('compete')}
          onMouseLeave={() => setOpen(null)}
        >
          {isLoggedIn ? (
            <span 
              className="topnav-link" 
              style={{ 
                ...menuItemStyle, 
                cursor: 'default',
                ...(open === 'compete' ? menuItemHoverStyle : {}),
                ...(isActiveRoute('/compete') ? { background: 'var(--green)', color: 'white', fontWeight: 800 } : {})
              }}
            >
              Compete
            </span>
          ) : (
            <a
              className="topnav-link"
              href="/#compete"
              onClick={(e) => {
                e.preventDefault()
                scrollToLandingSection('compete', 'center')
              }}
              style={{
                ...menuItemStyle,
                ...(hoveredItem === 'compete' ? menuItemHoverStyle : {}),
                ...(isActiveRoute('/compete') ? { background: 'var(--green)', color: 'white', fontWeight: 800 } : {})
              }}
              onMouseEnter={() => setHoveredItem('compete')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              Compete
            </a>
          )}
          <div
            style={{
              ...dropdownStyle,
              opacity: open === 'compete' ? 1 : 0,
              transform:
                open === 'compete'
                  ? 'translateY(0) scale(1)'
                  : 'translateY(-4px) scale(.98)',
              pointerEvents: open === 'compete' ? 'auto' : 'none',
            }}
          >
            <Link 
              href={isLoggedIn ? "/1v1" : "/login?mode=signup"} 
              prefetch={true}
              className="topnav-dropdown-link" 
              style={getActiveStyle('/1v1', {
                ...dropdownLinkStyle, 
                ...(hoveredItem === '1v1' ? dropdownLinkHoverStyle : {})
              })} 
              onClick={handleNavPageClick}
              onMouseEnter={() => setHoveredItem('1v1')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              1v1 Battles
            </Link>
            <Link 
              href={isLoggedIn ? "/compete/daily-battle" : "/login?mode=signup"} 
              prefetch={true}
              className="topnav-dropdown-link" 
              style={getActiveStyle('/compete/daily-battle', {
                ...dropdownLinkStyle, 
                ...(hoveredItem === 'daily-battle' ? dropdownLinkHoverStyle : {})
              })} 
              onClick={handleNavPageClick}
              onMouseEnter={() => setHoveredItem('daily-battle')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              Daily Battle
            </Link>
            <Link 
              href={isLoggedIn ? "/compete/weekly-duel" : "/login?mode=signup"} 
              prefetch={isLoggedIn ? true : false}
              className="topnav-dropdown-link" 
              style={getActiveStyle('/compete/weekly-duel', {
                ...dropdownLinkStyle, 
                ...(hoveredItem === 'weekly-duel' ? dropdownLinkHoverStyle : {})
              })} 
              onClick={handleNavPageClick}
              onMouseEnter={() => setHoveredItem('weekly-duel')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              Weekly Duel
            </Link>
            <Link 
              href="/compete/leaderboard" 
              prefetch={true}
              scroll 
              className="topnav-dropdown-link" 
              style={getActiveStyle('/compete/leaderboard', {
                ...dropdownLinkStyle, 
                ...(hoveredItem === 'leaderboard' ? dropdownLinkHoverStyle : {})
              })} 
              onClick={handleNavPageClick}
              onMouseEnter={() => setHoveredItem('leaderboard')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              Leaderboard
            </Link>
          </div>
        </div>

              </div>

      <div className="nav-right" style={{ position: 'relative' }}>
        {user ? (
          <>
                        <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 700 }}>
              {user.name ?? user.email ?? 'Account'}
            </span>
            <Link
              href={user.username ? `/profile/${user.username}` : "/profile"}
              prefetch={true}
              className="nav-login"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Profile
            </Link>
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setOpen('settings')}
              onMouseLeave={() => setOpen(null)}
            >
              <button className="nav-login" style={{ display: 'inline-flex', alignItems: 'center' }}>
                Settings <span style={{ fontSize: '12px', opacity: 0.7, marginLeft: '6px' }}>▾</span>
              </button>
              <div
                style={{
                  ...dropdownStyle,
                  left: 'auto',
                  right: 0,
                  minWidth: '200px',
                  opacity: open === 'settings' ? 1 : 0,
                  transform:
                    open === 'settings'
                      ? 'translateY(0) scale(1)'
                      : 'translateY(-4px) scale(.98)',
                  pointerEvents: open === 'settings' ? 'auto' : 'none',
                }}
              >
                <Link href="/settings" prefetch={true} className="topnav-dropdown-link" style={{...dropdownLinkStyle, ...(hoveredItem === 'settings' ? dropdownLinkHoverStyle : {})}} onClick={handleNavPageClick} onMouseEnter={() => setHoveredItem('settings')} onMouseLeave={() => setHoveredItem(null)}>
                  All Settings
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    style={{
                      ...dropdownLinkStyle,
                      width: '100%',
                      ...(hoveredItem === 'signout' ? dropdownLinkHoverStyle : {}),
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      padding: '12px'
                    }}
                    onMouseEnter={() => setHoveredItem('signout')} onMouseLeave={() => setHoveredItem(null)}
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={toggleTheme}
              className="nav-login"
              style={{ 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center',
                padding: '7px 14px',
                marginRight: '8px',
                background: 'transparent',
                border: '1px solid var(--border)',
                fontSize: '16px'
              }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <Link
              href="/login?mode=login"
              className="nav-login"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Log In
            </Link>
            <Link
              href="/login?mode=signup"
              className="nav-signup"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

