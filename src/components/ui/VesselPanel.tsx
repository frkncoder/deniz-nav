import type { AISTarget } from '../../types';

interface VesselPanelProps {
  vessel: AISTarget | null;
  onClose: () => void;
}

export function VesselPanel({ vessel, onClose }: VesselPanelProps) {
  if (!vessel) return null;

  return (
    <div className="vessel-panel panel-glass" style={{
      position: 'absolute',
      bottom: '100px', // BottomBar'ın hemen üstünde
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: '360px',
      zIndex: 20,
      padding: '16px',
      borderRadius: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L20 20L12 17L4 20L12 2Z" />
          </svg>
          {vessel.name}
        </h3>
        <button className="btn" style={{ padding: '4px', minHeight: 'auto', background: 'transparent' }} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>
          <div style={{ color: 'var(--clr-text-muted)', fontSize: '11px', marginBottom: '4px' }}>MMSI</div>
          <div style={{ fontWeight: 600 }}>{vessel.mmsi}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>
          <div style={{ color: 'var(--clr-text-muted)', fontSize: '11px', marginBottom: '4px' }}>TİP</div>
          <div style={{ fontWeight: 600 }}>{vessel.type}</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>
          <div style={{ color: 'var(--clr-text-muted)', fontSize: '11px', marginBottom: '4px' }}>HIZ (SOG)</div>
          <div style={{ fontWeight: 600 }}>{vessel.speed.toFixed(1)} kn</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>
          <div style={{ color: 'var(--clr-text-muted)', fontSize: '11px', marginBottom: '4px' }}>ROTA (COG)</div>
          <div style={{ fontWeight: 600 }}>{Math.round(vessel.course)}°</div>
        </div>
      </div>
    </div>
  );
}
