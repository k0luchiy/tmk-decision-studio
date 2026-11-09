import React from 'react';
import { ArrowUpRight, Check, ChevronDown, Info } from 'lucide-react';
import { clamp } from '../core/format.js';

export function Button({ children, variant = 'secondary', size = 'md', icon: Icon, rightIcon: RightIcon, onClick, disabled, type = 'button', className = '', title }) {
  return (
    <button type={type} className={`btn btn-${variant} btn-${size} ${className}`} onClick={onClick} disabled={disabled} title={title}>
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children && <span>{children}</span>}
      {RightIcon && <RightIcon size={size === 'sm' ? 14 : 16} />}
    </button>
  );
}

export function Pill({ children, tone = 'neutral', dot = false }) {
  return (
    <span className={`pill pill-${tone}`}>
      {dot && <i className="pill-dot" />}
      {children}
    </span>
  );
}

export function SectionHead({ eyebrow, title, description, actions, className = '' }) {
  return (
    <div className={`section-head ${className}`}>
      <div className="section-head-copy">
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        {title && <h2>{title}</h2>}
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="section-head-actions">{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">
        {label}
        {hint && <i className="field-hint" title={hint}><Info size={12} /></i>}
      </span>
      {children}
    </label>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, format, leftLabel, rightLabel, note }) {
  return (
    <div className="slider-field">
      <div className="slider-head">
        <span className="field-label">{label}</span>
        <b className="slider-value">{format ? format(value) : value}</b>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <div className="slider-scale">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      {note && <p className="field-note">{note}</p>}
    </div>
  );
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`segmented ${className}`}>
      {options.map((option) => {
        const id = typeof option === 'string' ? option : option.id;
        const label = typeof option === 'string' ? option : option.label;
        return (
          <button key={id} type="button" className={value === id ? 'on' : ''} onClick={() => onChange(id)}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Metric({ label, value, unit, note, accent = false, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`metric-card ${accent ? 'accent' : ''}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <span className="metric-label">{label}</span>
      <div className="metric-value">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      {note && <span className="metric-note">{note}</span>}
    </Tag>
  );
}

export function Progress({ value, tone = 'accent' }) {
  return (
    <div className={`progress progress-${tone}`}>
      <i style={{ width: `${clamp(value, 0, 100)}%` }} />
    </div>
  );
}

export function Ring({ value, size = 132, label = 'уверенность' }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamp(value, 0, 100) / 100) * circumference;
  return (
    <div className="confidence-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="ring-track" cx="50" cy="50" r={radius} />
        <circle className="ring-value" cx="50" cy="50" r={radius} strokeDasharray={`${dash} ${circumference}`} />
      </svg>
      <div className="ring-label">
        <strong>{Math.round(value)}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Collapse({ open, children }) {
  if (!open) return null;
  return <div className="collapse-body">{children}</div>;
}

export function Chevron({ open }) {
  return <ChevronDown size={16} className={`chevron ${open ? 'open' : ''}`} />;
}

export function LinkButton({ children, onClick, icon: Icon = ArrowUpRight }) {
  return (
    <button type="button" className="link-button" onClick={onClick}>
      <span>{children}</span>
      <Icon size={14} />
    </button>
  );
}

export function CheckLine({ children }) {
  return (
    <span className="check-line">
      <Check size={13} />
      {children}
    </span>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <Check size={15} />
      {message}
    </div>
  );
}
