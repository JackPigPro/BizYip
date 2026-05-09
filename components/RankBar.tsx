'use client'

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

  return (
    <div className="rank-bar">
      <div className="fs-label b" style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--gold)' }}>🏆 Rank tiers</div>
      <div className="rank-container">
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
