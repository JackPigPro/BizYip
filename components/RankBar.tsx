'use client'

import React from 'react'
import Link from 'next/link'

interface Walker {
  id: number
  character: {
    id: number
    gender: string
    skinTone: string
    hairColor: string
    hairStyle: string
    shirtColor: string
    tieColor: string
    name: string
  }
  startTime: number
}

export default function RankBar() {
  const ranks = [
    { name: 'Trainee', elo: '0-499', color: 'rgba(156, 163, 175, 0.7)', percentage: 35 },
    { name: 'Builder', elo: '500-749', color: 'rgba(59, 130, 246, 0.7)', percentage: 25 },
    { name: 'Creator', elo: '750-999', color: 'rgba(34, 197, 94, 0.7)', percentage: 18 },
    { name: 'Founder', elo: '1000-1249', color: 'rgba(234, 179, 8, 0.7)', percentage: 12 },
    { name: 'Visionary', elo: '1250-1499', color: 'rgba(168, 85, 247, 0.7)', percentage: 6 },
    { name: 'Icon', elo: '1500-1749', color: 'rgba(249, 115, 22, 0.7)', percentage: 3 },
    { name: 'Titan', elo: '1750-1999', color: 'rgba(239, 68, 68, 0.7)', percentage: 0.9 },
    { name: 'Unicorn', elo: '2000+', color: 'rgba(124, 58, 237, 0.7)', gradient: 'linear-gradient(135deg, rgba(124, 58, 237, 0.7), rgba(236, 72, 153, 0.7), rgba(16, 185, 129, 0.7))', percentage: 0.1 }
  ]

  // 20 diverse character variations
  const characterTemplates = [
    // Male characters
    { id: 1, gender: 'male', skinTone: '#fdbcb4', hairColor: '#8b4513', hairStyle: 'short', shirtColor: '#4a90e2', tieColor: '#d63031', name: 'alex' },
    { id: 2, gender: 'male', skinTone: '#f4c2a1', hairColor: '#333', hairStyle: 'short', shirtColor: '#2ecc71', tieColor: '#e74c3c', name: 'marcus' },
    { id: 3, gender: 'male', skinTone: '#8d5524', hairColor: '#000', hairStyle: 'short', shirtColor: '#9b59b6', tieColor: '#3498db', name: 'jamal' },
    { id: 4, gender: 'male', skinTone: '#ffdbac', hairColor: '#d4af37', hairStyle: 'short', shirtColor: '#e67e22', tieColor: '#c0392b', name: 'chen' },
    { id: 5, gender: 'male', skinTone: '#c68642', hairColor: '#654321', hairStyle: 'short', shirtColor: '#16a085', tieColor: '#27ae60', name: 'raj' },
    { id: 6, gender: 'male', skinTone: '#f5deb3', hairColor: '#ff6347', hairStyle: 'spiky', shirtColor: '#34495e', tieColor: '#e74c3c', name: 'kevin' },
    { id: 7, gender: 'male', skinTone: '#de8d6b', hairColor: '#4a4a4a', hairStyle: 'short', shirtColor: '#2980b9', tieColor: '#f39c12', name: 'omar' },
    { id: 8, gender: 'male', skinTone: '#ffe4c4', hairColor: '#ffd700', hairStyle: 'short', shirtColor: '#27ae60', tieColor: '#8e44ad', name: 'david' },
    { id: 9, gender: 'male', skinTone: '#a0522d', hairColor: '#2f4f4f', hairStyle: 'curly', shirtColor: '#c0392b', tieColor: '#f1c40f', name: 'samuel' },
    { id: 10, gender: 'male', skinTone: '#faebd7', hairColor: '#dc143c', hairStyle: 'short', shirtColor: '#8e44ad', tieColor: '#3498db', name: 'nathan' },
    
    // Female characters
    { id: 11, gender: 'female', skinTone: '#fdbcb4', hairColor: '#8b4513', hairStyle: 'long', shirtColor: '#ff69b4', tieColor: '#ff1493', name: 'sarah' },
    { id: 12, gender: 'female', skinTone: '#f4c2a1', hairColor: '#333', hairStyle: 'ponytail', shirtColor: '#9370db', tieColor: '#8b008b', name: 'maya' },
    { id: 13, gender: 'female', skinTone: '#8d5524', hairColor: '#000', hairStyle: 'braids', shirtColor: '#20b2aa', tieColor: '#008b8b', name: 'akeelah' },
    { id: 14, gender: 'female', skinTone: '#ffdbac', hairColor: '#d4af37', hairStyle: 'long', shirtColor: '#ff6347', tieColor: '#dc143c', name: 'lin' },
    { id: 15, gender: 'female', skinTone: '#c68642', hairColor: '#654321', hairStyle: 'ponytail', shirtColor: '#4682b4', tieColor: '#191970', name: 'priya' },
    { id: 16, gender: 'female', skinTone: '#f5deb3', hairColor: '#ff6347', hairStyle: 'short', shirtColor: '#32cd32', tieColor: '#228b22', name: 'zoe' },
    { id: 17, gender: 'female', skinTone: '#de8d6b', hairColor: '#4a4a4a', hairStyle: 'curly', shirtColor: '#ff1493', tieColor: '#c71585', name: 'fatima' },
    { id: 18, gender: 'female', skinTone: '#ffe4c4', hairColor: '#ffd700', hairStyle: 'long', shirtColor: '#00ced1', tieColor: '#008b8b', name: 'emma' },
    { id: 19, gender: 'female', skinTone: '#a0522d', hairColor: '#2f4f4f', hairStyle: 'braids', shirtColor: '#ff69b4', tieColor: '#ff1493', name: 'naomi' },
    { id: 20, gender: 'female', skinTone: '#faebd7', hairColor: '#dc143c', hairStyle: 'short', shirtColor: '#9370db', tieColor: '#4b0082', name: 'olivia' }
  ]

  const [activeWalkers, setActiveWalkers] = React.useState<Walker[]>([])
  const [lastCharacterId, setLastCharacterId] = React.useState<number | null>(null)

  // Reset and start fresh spawning system
  React.useEffect(() => {
    // Clear any existing walkers
    setActiveWalkers([])
    setLastCharacterId(null)
    
    let spawnTimeout: NodeJS.Timeout
    
    const spawnWalker = () => {
      // Get available characters (exclude last used one)
      const availableCharacters = characterTemplates.filter(char => char.id !== lastCharacterId)
      const randomCharacter = availableCharacters[Math.floor(Math.random() * availableCharacters.length)]
      const randomDelay = 3000 + Math.random() * 5000 // 3-8 seconds
      
      const newWalker = {
        id: Date.now() + Math.random(), // Ensure unique ID
        character: randomCharacter,
        startTime: Date.now()
      }
      
      setActiveWalkers(prev => [...prev, newWalker])
      setLastCharacterId(randomCharacter.id)
      
      // Remove walker immediately when animation ends (30 seconds exactly)
      setTimeout(() => {
        setActiveWalkers(prev => prev.filter(w => w.id !== newWalker.id))
      }, 30000)
      
      // Schedule next walker
      spawnTimeout = setTimeout(spawnWalker, randomDelay)
    }
    
    // Start first walker after 3 seconds
    spawnTimeout = setTimeout(spawnWalker, 3000)
    
    return () => {
      if (spawnTimeout) clearTimeout(spawnTimeout)
    }
  }, []) // Empty dependency array to run only once

  return (
    <div className="rank-bar">
      <div className="fs-label b" style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--gold)' }}>🏆 Rank tiers</div>
      <div className="rank-container">
        {/* Multiple walking founders behind the text */}
        {activeWalkers.map((walker) => (
          <div key={walker.id} className="walking-founder">
            <div className="founder-character">
              <div className="founder-body">
                {/* Head */}
                <div className="founder-head" style={{ background: walker.character.skinTone }}>
                  <div className="hair" style={{ 
                    background: walker.character.hairColor,
                    ...(walker.character.hairStyle === 'long' && { width: '45px', height: '25px' }),
                    ...(walker.character.hairStyle === 'ponytail' && { width: '35px', height: '30px', borderRadius: '50% 50% 50% 0' }),
                    ...(walker.character.hairStyle === 'braids' && { width: '40px', height: '20px', background: `repeating-linear-gradient(90deg, ${walker.character.hairColor} 0px, ${walker.character.hairColor} 3px, #333 3px, #333 6px)` }),
                    ...(walker.character.hairStyle === 'curly' && { borderRadius: '50% 50% 60% 40%' }),
                    ...(walker.character.hairStyle === 'spiky' && { clipPath: 'polygon(20% 0%, 40% 30%, 60% 0%, 80% 40%, 100% 10%, 90% 60%, 70% 100%, 50% 70%, 30% 100%, 10% 60%, 0% 10%, 20% 40%)' })
                  }}></div>
                  <div className="face">
                    <div className="eye left"></div>
                    <div className="eye right"></div>
                    <div className="mouth"></div>
                  </div>
                </div>
                
                {/* Body */}
                <div className="founder-torso">
                  <div className="shirt" style={{ background: `linear-gradient(135deg, ${walker.character.shirtColor}, ${walker.character.shirtColor}dd)` }}></div>
                  {walker.character.gender === 'male' && (
                    <div className="tie" style={{ background: walker.character.tieColor }}></div>
                  )}
                </div>
                
                {/* Arms */}
                <div className="founder-arms">
                  <div className="arm left" style={{ animation: `armSwingLeft 1.2s infinite` }}>
                    <div className="shoulder" style={{ background: walker.character.skinTone }}></div>
                    <div className="forearm" style={{ background: walker.character.skinTone }}></div>
                    <div className="hand" style={{ background: walker.character.skinTone }}></div>
                  </div>
                  <div className="arm right" style={{ animation: `armSwingRight 1.2s infinite` }}>
                    <div className="shoulder" style={{ background: walker.character.skinTone }}></div>
                    <div className="forearm" style={{ background: walker.character.skinTone }}></div>
                    <div className="hand" style={{ background: walker.character.skinTone }}></div>
                  </div>
                </div>
                
                {/* Legs */}
                <div className="founder-legs">
                  <div className="leg left" style={{ animation: `legWalkLeft 1.2s infinite` }}>
                    <div className="hip" style={{ background: walker.character.skinTone }}></div>
                    <div className="thigh"></div>
                    <div className="shin" style={{ animation: `shinWalkLeft 1.2s infinite` }}></div>
                    <div className="shoe"></div>
                  </div>
                  <div className="leg right" style={{ animation: `legWalkRight 1.2s infinite` }}>
                    <div className="hip" style={{ background: walker.character.skinTone }}></div>
                    <div className="thigh"></div>
                    <div className="shin" style={{ animation: `shinWalkRight 1.2s infinite` }}></div>
                    <div className="shoe"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {ranks.map((rank, index) => (
          <div 
            key={rank.name}
            className="rank-item"
            style={{ 
              background: rank.gradient || rank.color,
              borderLeft: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <div className="rank-name">{rank.name}</div>
            <div className="rank-percentage">{rank.percentage}%</div>
            <div className="rank-elo">{rank.elo}</div>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .rank-bar {
          width: 100%;
          background: linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.1) 100%);
          position: relative;
          overflow: hidden;
        }
        
        .rank-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }
        
        .rank-container {
          width: 100%;
          display: flex;
          height: 162px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
          position: relative;
          z-index: 1;
        }
        
        .rank-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }
        
        .walking-founder {
          position: absolute;
          bottom: 0px;
          left: -150px;
          z-index: 0;
          animation: walkAcross 30s linear forwards;
          pointer-events: none;
          will-change: transform;
        }
        
        .founder-character {
          width: 120px;
          height: 97px;
          position: relative;
        }
        
        .founder-body {
          position: relative;
          width: 100%;
          height: 100%;
          animation: bodyBounce 1.2s infinite;
        }
        
        .founder-head {
          width: 40px;
          height: 40px;
          background: #fdbcb4;
          border-radius: 50% 50% 45% 45%;
          position: absolute;
          top: 5px;
          left: 70px;
          border: 3px solid #333;
          z-index: 3;
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .hair {
          width: 42px;
          height: 20px;
          background: #8b4513;
          border-radius: 50% 50% 0 0;
          position: absolute;
          top: -8px;
          left: -1px;
          border: 3px solid #333;
          border-bottom: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .face {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .eye {
          width: 6px;
          height: 8px;
          background: #333;
          border-radius: 50%;
          position: absolute;
          top: 12px;
        }
        
        .eye.left {
          left: 8px;
        }
        
        .eye.right {
          right: 8px;
        }
        
        .mouth {
          width: 12px;
          height: 4px;
          background: #d63031;
          border-radius: 0 0 6px 6px;
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .founder-torso {
          width: 50px;
          height: 60px;
          background: #4a90e2;
          border-radius: 15px 15px 10px 10px;
          position: absolute;
          top: 40px;
          left: 65px;
          border: 3px solid #333;
          z-index: 2;
          box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        .shirt {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #4a90e2, #357abd);
          border-radius: inherit;
          position: relative;
          box-shadow: inset 0 2px 4px rgba(255,255,255,0.2);
        }
        
        .tie {
          width: 8px;
          height: 35px;
          background: linear-gradient(180deg, #d63031, #a02020);
          position: absolute;
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 2px;
          border: 2px solid #333;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .founder-arms {
          position: absolute;
          top: 45px;
          left: 55px;
          width: 70px;
          height: 50px;
        }
        
        .arm {
          position: absolute;
          width: 15px;
          height: 45px;
        }
        
        .arm.left {
          left: 0;
          animation: armSwingLeft 1.2s infinite;
          transform-origin: top center;
        }
        
        .arm.right {
          right: 0;
          animation: armSwingRight 1.2s infinite;
          transform-origin: top center;
        }
        
        .shoulder {
          width: 18px;
          height: 18px;
          background: #fdbcb4;
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          border: 2px solid #333;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
        
        .forearm {
          width: 12px;
          height: 25px;
          background: #fdbcb4;
          border-radius: 6px;
          position: absolute;
          top: 15px;
          left: 50%;
          transform: translateX(-50%);
          border: 2px solid #333;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .hand {
          width: 14px;
          height: 14px;
          background: #fdbcb4;
          border-radius: 50%;
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          border: 2px solid #333;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .founder-legs {
          position: absolute;
          top: 95px;
          left: 70px;
          width: 40px;
          height: 60px;
        }
        
        .leg {
          position: absolute;
          width: 15px;
          height: 60px;
        }
        
        .leg.left {
          left: 0;
          animation: legWalkLeft 1.2s infinite;
        }
        
        .leg.right {
          right: 0;
          animation: legWalkRight 1.2s infinite;
        }
        
        .hip {
          width: 18px;
          height: 12px;
          background: #2c3e50;
          border-radius: 50%;
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          border: 2px solid #333;
        }
        
        .thigh {
          width: 14px;
          height: 25px;
          background: #2c3e50;
          border: 2px solid #333;
          border-radius: 7px 7px 0 0;
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .shin {
          width: 12px;
          height: 22px;
          background: #34495e;
          border: 2px solid #333;
          position: absolute;
          top: 33px;
          left: 50%;
          transform: translateX(-50%);
          transform-origin: top center;
        }
        
        .leg.left .shin {
          animation: shinWalkLeft 1.2s infinite;
        }
        
        .leg.right .shin {
          animation: shinWalkRight 1.2s infinite;
        }
        
        .shoe {
          width: 20px;
          height: 10px;
          background: linear-gradient(180deg, #333, #222);
          border-radius: 10px 10px 5px 5px;
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          border: 2px solid #222;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        @keyframes walkAcross {
          0% {
            left: -150px;
            opacity: 1;
          }
          100% {
            left: calc(100% + 150px);
            opacity: 1;
          }
        }
        
        @keyframes bodyBounce {
          0%, 100% {
            transform: translateY(0px);
          }
          25% {
            transform: translateY(-2px);
          }
          50% {
            transform: translateY(0px);
          }
          75% {
            transform: translateY(-2px);
          }
        }
        
        @keyframes armSwingLeft {
          0%, 100% {
            transform: rotate(-20deg);
          }
          50% {
            transform: rotate(20deg);
          }
        }
        
        @keyframes armSwingRight {
          0%, 100% {
            transform: rotate(20deg);
          }
          50% {
            transform: rotate(-20deg);
          }
        }
        
        @keyframes legWalkLeft {
          0%, 100% {
            transform: rotate(-15deg);
          }
          50% {
            transform: rotate(15deg);
          }
        }
        
        @keyframes legWalkRight {
          0%, 100% {
            transform: rotate(15deg);
          }
          50% {
            transform: rotate(-15deg);
          }
        }
        
        @keyframes shinWalkLeft {
          0%, 100% {
            transform: rotate(-10deg);
          }
          50% {
            transform: rotate(10deg);
          }
        }
        
        @keyframes shinWalkRight {
          0%, 100% {
            transform: rotate(10deg);
          }
          50% {
            transform: rotate(-10deg);
          }
        }
        
        .rank-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 8px;
          text-align: center;
          transition: all 0.3s ease;
          cursor: default;
          position: relative;
          z-index: 1;
        }
        
        .rank-item:hover {
          transform: translateY(-2px);
          box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
        }
        
        .rank-name {
          font-size: 18px;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          margin-bottom: 6px;
          font-family: var(--font-display);
          letter-spacing: 0.5px;
        }
        
        .rank-percentage {
          font-size: 20px;
          font-weight: 800;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          font-family: var(--font-display);
          margin: 3px 0;
        }
        
        .rank-elo {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          font-family: var(--font-body);
        }
        
        @media (max-width: 768px) {
          .rank-container {
            height: 130px;
          }
          
          .walking-founder {
            bottom: 0px;
          }
          
          .founder-character {
            width: 84px;
            height: 68px;
          }
          
          .founder-head {
            width: 28px;
            height: 28px;
            top: 3px;
            left: 49px;
          }
          
          .hair {
            width: 30px;
            height: 14px;
            top: -6px;
            left: -1px;
          }
          
          .eye {
            width: 4px;
            height: 6px;
            top: 8px;
          }
          
          .eye.left {
            left: 6px;
          }
          
          .eye.right {
            right: 6px;
          }
          
          .mouth {
            width: 8px;
            height: 3px;
            bottom: 6px;
          }
          
          .founder-torso {
            width: 35px;
            height: 42px;
            top: 28px;
            left: 46px;
          }
          
          .tie {
            width: 6px;
            height: 25px;
            top: 3px;
          }
          
          .founder-arms {
            top: 32px;
            left: 39px;
            width: 49px;
            height: 35px;
          }
          
          .arm {
            width: 10px;
            height: 32px;
          }
          
          .shoulder {
            width: 12px;
            height: 12px;
          }
          
          .forearm {
            width: 8px;
            height: 18px;
            top: 10px;
          }
          
          .hand {
            width: 10px;
            height: 10px;
          }
          
          .founder-legs {
            top: 67px;
            left: 49px;
            width: 28px;
            height: 42px;
          }
          
          .leg {
            width: 10px;
            height: 42px;
          }
          
          .hip {
            width: 12px;
            height: 8px;
          }
          
          .thigh {
            width: 10px;
            height: 18px;
            top: 7px;
          }
          
          .shin {
            width: 8px;
            height: 15px;
            top: 23px;
          }
          
          .shoe {
            width: 14px;
            height: 7px;
          }
          
          .rank-name {
            font-size: 15px;
          }
          
          .rank-elo {
            font-size: 12px;
          }
          
          .rank-item {
            padding: 8px 4px;
          }
        }
        
        @media (max-width: 480px) {
          .rank-container {
            height: 114px;
          }
          
          .walking-founder {
            bottom: 0px;
          }
          
          .founder-character {
            width: 60px;
            height: 48px;
          }
          
          .founder-head {
            width: 20px;
            height: 20px;
            top: 2px;
            left: 35px;
          }
          
          .hair {
            width: 22px;
            height: 10px;
            top: -4px;
            left: -1px;
          }
          
          .eye {
            width: 3px;
            height: 4px;
            top: 6px;
          }
          
          .eye.left {
            left: 4px;
          }
          
          .eye.right {
            right: 4px;
          }
          
          .mouth {
            width: 6px;
            height: 2px;
            bottom: 4px;
          }
          
          .founder-torso {
            width: 25px;
            height: 30px;
            top: 20px;
            left: 32px;
          }
          
          .tie {
            width: 4px;
            height: 18px;
            top: 2px;
          }
          
          .founder-arms {
            top: 22px;
            left: 28px;
            width: 35px;
            height: 25px;
          }
          
          .arm {
            width: 8px;
            height: 22px;
          }
          
          .shoulder {
            width: 10px;
            height: 10px;
          }
          
          .forearm {
            width: 6px;
            height: 12px;
            top: 8px;
          }
          
          .hand {
            width: 8px;
            height: 8px;
          }
          
          .founder-legs {
            top: 47px;
            left: 35px;
            width: 20px;
            height: 30px;
          }
          
          .leg {
            width: 8px;
            height: 30px;
          }
          
          .hip {
            width: 10px;
            height: 6px;
          }
          
          .thigh {
            width: 8px;
            height: 12px;
            top: 5px;
          }
          
          .shin {
            width: 6px;
            height: 10px;
            top: 16px;
          }
          
          .shoe {
            width: 10px;
            height: 5px;
          }
          
          .rank-name {
            font-size: 14px;
          }
          
          .rank-elo {
            font-size: 11px;
          }
          
          .rank-item {
            padding: 6px 2px;
          }
        }
      `}</style>
    </div>
  )
}
