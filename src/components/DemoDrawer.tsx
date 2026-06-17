import React from 'react';
import { Sparkles, ChevronRight, Check, Play, Pause } from 'lucide-react';

interface DemoStep {
  s: number;
  title: string;
  desc: string;
}

interface DemoDrawerProps {
  show: boolean;
  demoStep: number;
  demoLog: string[];
  isAutoPlaying: boolean;
  steps: DemoStep[];
  onClose: () => void;
  onRunStep: () => void;
  onToggleAutoplay: () => void;
  onReset: () => void;
  t: (key: string) => string;
}

export function DemoDrawer({
  show, demoStep, demoLog, isAutoPlaying, steps,
  onClose, onRunStep, onToggleAutoplay, onReset, t,
}: DemoDrawerProps) {
  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ flex: 1 }} onClick={onClose} />

      <div
        style={{ width: '450px', maxWidth: '90vw', height: '100%', backgroundColor: 'white', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem', overflowY: 'hidden' }}
        className="animate-fade-in"
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--neutral-border)', paddingBottom: '0.5rem' }}>
            <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '1.15rem', margin: 0 }}>
              <Sparkles size={18} style={{ color: 'var(--accent)' }} /> {t('demo.drawer_title')}
            </h3>
            <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'gray', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
            {t('demo.drawer_desc')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', flex: 1, paddingRight: '0.25rem', marginBottom: '1rem' }}>
            {steps.map(item => (
              <div
                key={item.s}
                style={{
                  display: 'flex', gap: '0.50rem', padding: '0.4rem 0.5rem', borderRadius: '4px',
                  border: `1.5px solid ${demoStep === item.s ? 'var(--accent)' : 'var(--neutral-border)'}`,
                  backgroundColor: demoStep === item.s ? 'var(--accent-light)' : demoStep > item.s ? 'var(--primary-light)' : 'white',
                  opacity: demoStep >= item.s ? 1 : 0.6,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: demoStep > item.s ? 'var(--primary)' : 'var(--neutral-border)', color: demoStep > item.s ? 'white' : 'var(--neutral-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                  {demoStep > item.s ? <Check size={10} /> : item.s}
                </div>
                <div>
                  <strong style={{ fontSize: '0.75rem', display: 'block', color: 'var(--primary)', lineHeight: '1.2' }}>{item.title}</strong>
                  <span style={{ fontSize: '0.65rem', color: 'gray' }}>{item.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: '#1e1e24', color: '#27ae60', padding: '0.75rem', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.72rem', minHeight: '110px', maxHeight: '110px', overflowY: 'auto', border: '1px solid #2d2d34', marginBottom: '1rem' }}>
            <span style={{ color: '#8c887e', display: 'block', marginBottom: '0.25rem' }}>{t('demo.console_title')}</span>
            {demoLog.map((log, idx) => (
              <div key={idx} style={{ marginBottom: '0.25rem', lineHeight: '1.3' }}>{log}</div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--neutral-border)' }}>
            <button
              onClick={onRunStep}
              disabled={isAutoPlaying}
              className="btn btn-primary"
              style={{ flex: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              {t('demo.step')} {demoStep} <ChevronRight size={14} />
            </button>
            <button
              onClick={onToggleAutoplay}
              className={`btn ${isAutoPlaying ? 'btn-danger' : 'btn-accent'}`}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.8rem', padding: '0.5rem' }}
            >
              {isAutoPlaying ? <Pause size={12} /> : <Play size={12} />}
              {isAutoPlaying ? t('demo.btn_pause') : t('demo.btn_autoplay')}
            </button>
            <button
              onClick={onReset}
              className="btn btn-secondary"
              style={{ flex: 0.8, fontSize: '0.8rem', padding: '0.5rem' }}
            >
              {t('demo.btn_reset')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
