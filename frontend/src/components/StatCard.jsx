import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, icon: Icon, color = '#8B5CF6' }) {
  const isPositive = !change || change.startsWith('+');

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: `${color}1A`,
            border: `1px solid ${color}33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon size={20} color={color} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFF' }}>
          {value}
        </h3>
        {change && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: isPositive ? '#34D399' : '#FB7185'
          }}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
