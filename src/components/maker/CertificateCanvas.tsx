import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AlignCenter, Copy, Trash2, Edit3, Move, Maximize2 } from 'lucide-react';
import { CertificateTemplate, CanvasElement, SignatureConfig, StampConfig } from '../../types';
import { interpolateText } from '../../lib/certificateGenerator';

interface CertificateCanvasProps {
  template: CertificateTemplate;
  recipientContext?: Record<string, any>;
  scale?: number;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  onUpdateElementPosition?: (id: string, x: number, y: number, isDraggingEnd?: boolean) => void;
  onUpdateElement?: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement?: (id: string) => void;
  onDuplicateElement?: (id: string) => void;
  interactive?: boolean;
  forwardRef?: React.RefObject<HTMLDivElement | null>;
}

export const CertificateCanvas: React.FC<CertificateCanvasProps> = ({
  template,
  recipientContext = {},
  scale = 1,
  selectedElementId = null,
  onSelectElement,
  onUpdateElementPosition,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  interactive = false,
  forwardRef
}) => {
  const containerCanvasRef = useRef<HTMLDivElement | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [liveDragCoords, setLiveDragCoords] = useState<{ x: number; y: number } | null>(null);
  const [snapGuide, setSnapGuide] = useState<{ x: boolean; y: boolean }>({ x: false, y: false });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const [activeResizeId, setActiveResizeId] = useState<string | null>(null);
  const [liveResizeWidth, setLiveResizeWidth] = useState<number | null>(null);

  // Inline editing state
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditText, setInlineEditText] = useState<string>('');

  const dragSessionRef = useRef<{
    elementId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    hasMoved: boolean;
  } | null>(null);

  const resizeSessionRef = useRef<{
    elementId: string;
    startX: number;
    origWidth: number;
  } | null>(null);

  // Merge default template dynamic values with provided recipientContext
  const contextData: Record<string, any> = {
    institutionName: template.institution.name,
    institutionShortName: template.institution.shortName,
    certificateType: template.certificateType,
    certificateId: template.verification.prefix + '-' + template.verification.year + '-001001',
    issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    courseName: 'Advanced Machine Learning & Neural Networks',
    recipientName: 'Sophia Montgomery',
    firstName: 'Sophia',
    lastName: 'Montgomery',
    department: template.institution.department || 'Computer Science',
    batch: 'Class of 2026',
    grade: 'A+ (Summa Cum Laude)',
    score: '98.5%',
    position: '1st Rank',
    studentId: 'STU-9921',
    verificationUrl: `${template.verification.verificationBaseUrl}?id=${template.verification.prefix}-${template.verification.year}-001001`,
    ...recipientContext
  };

  // Dimensions based on orientation & page size
  const isLandscape = template.orientation === 'landscape';
  const baseWidth = isLandscape ? 1000 : 707;
  const baseHeight = isLandscape ? 707 : 1000;

  // Sync refs
  const setCanvasRef = useCallback((node: HTMLDivElement | null) => {
    containerCanvasRef.current = node;
    if (forwardRef) {
      if (typeof forwardRef === 'function') {
        (forwardRef as any)(node);
      } else {
        (forwardRef as any).current = node;
      }
    }
  }, [forwardRef]);

  // Window pointermove and pointerup for dragging
  useEffect(() => {
    if (!interactive) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      // Handle element drag
      if (dragSessionRef.current && containerCanvasRef.current) {
        const session = dragSessionRef.current;
        const rect = containerCanvasRef.current.getBoundingClientRect();
        const deltaPxX = e.clientX - session.startX;
        const deltaPxY = e.clientY - session.startY;

        if (Math.hypot(deltaPxX, deltaPxY) > 3) {
          session.hasMoved = true;
          setIsDragging(true);
        }

        if (session.hasMoved) {
          // rect width and height are scaled by CSS transform, so dividing by rect gives correct percentage!
          const deltaPctX = (deltaPxX / rect.width) * 100;
          const deltaPctY = (deltaPxY / rect.height) * 100;

          let newX = Math.round((session.origX + deltaPctX) * 10) / 10;
          let newY = Math.round((session.origY + deltaPctY) * 10) / 10;

          newX = Math.max(2, Math.min(98, newX));
          newY = Math.max(2, Math.min(98, newY));

          // Snap to 50% center guides
          let snappedX = false;
          let snappedY = false;
          if (Math.abs(newX - 50) < 1.2) {
            newX = 50;
            snappedX = true;
          }
          if (Math.abs(newY - 50) < 1.2) {
            newY = 50;
            snappedY = true;
          }

          setSnapGuide({ x: snappedX, y: snappedY });
          setLiveDragCoords({ x: newX, y: newY });
          onUpdateElementPosition?.(session.elementId, newX, newY, false);
        }
      }

      // Handle element width resize
      if (resizeSessionRef.current && containerCanvasRef.current) {
        const session = resizeSessionRef.current;
        const rect = containerCanvasRef.current.getBoundingClientRect();
        const deltaPxX = e.clientX - session.startX;
        // Since elements are center-anchored, dragging right edge by dx changes width by 2*dx
        const deltaPctWidth = (deltaPxX / rect.width) * 200;
        const newWidth = Math.max(10, Math.min(96, Math.round(session.origWidth + deltaPctWidth)));

        setIsResizing(true);
        setLiveResizeWidth(newWidth);
        onUpdateElement?.(session.elementId, { width: newWidth });
      }
    };

    const handleWindowPointerUp = () => {
      if (dragSessionRef.current) {
        const session = dragSessionRef.current;
        if (session.hasMoved && liveDragCoords) {
          onUpdateElementPosition?.(session.elementId, liveDragCoords.x, liveDragCoords.y, true);
        }
        dragSessionRef.current = null;
        setIsDragging(false);
        setActiveDragId(null);
        setLiveDragCoords(null);
        setSnapGuide({ x: false, y: false });
      }

      if (resizeSessionRef.current) {
        resizeSessionRef.current = null;
        setIsResizing(false);
        setActiveResizeId(null);
        setLiveResizeWidth(null);
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [interactive, liveDragCoords, onUpdateElementPosition, onUpdateElement]);

  // Keyboard navigation when an element is selected (Arrow nudge, Delete, Escape)
  useEffect(() => {
    if (!interactive || !selectedElementId || inlineEditId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const activeEl = template.elements.find((el) => el.id === selectedElementId);
      if (!activeEl) return;

      const step = e.shiftKey ? 2.0 : 0.5;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const nextX = Math.max(2, Math.round((activeEl.x - step) * 10) / 10);
        onUpdateElementPosition?.(activeEl.id, nextX, activeEl.y, true);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextX = Math.min(98, Math.round((activeEl.x + step) * 10) / 10);
        onUpdateElementPosition?.(activeEl.id, nextX, activeEl.y, true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const nextY = Math.max(2, Math.round((activeEl.y - step) * 10) / 10);
        onUpdateElementPosition?.(activeEl.id, activeEl.x, nextY, true);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextY = Math.min(98, Math.round((activeEl.y + step) * 10) / 10);
        onUpdateElementPosition?.(activeEl.id, activeEl.x, nextY, true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDeleteElement?.(activeEl.id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSelectElement?.(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        onDuplicateElement?.(activeEl.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [interactive, selectedElementId, inlineEditId, template.elements, onUpdateElementPosition, onDeleteElement, onSelectElement, onDuplicateElement]);

  const handleStartDrag = (e: React.PointerEvent, el: CanvasElement) => {
    if (!interactive) return;
    if (inlineEditId === el.id) return;

    e.stopPropagation();
    onSelectElement?.(el.id);

    dragSessionRef.current = {
      elementId: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      hasMoved: false
    };
    setActiveDragId(el.id);
  };

  const handleStartResize = (e: React.PointerEvent, el: CanvasElement) => {
    if (!interactive) return;
    e.stopPropagation();

    resizeSessionRef.current = {
      elementId: el.id,
      startX: e.clientX,
      origWidth: el.width || 50
    };
    setActiveResizeId(el.id);
  };

  const handleCommitInlineEdit = () => {
    if (inlineEditId) {
      onUpdateElement?.(inlineEditId, { content: inlineEditText });
      setInlineEditId(null);
    }
  };

  // Render border decoration based on style preset
  const renderBorder = () => {
    const b = template.border;
    if (!b || b.preset === 'none') return null;

    const pad = b.padding ?? 16;
    const thickness = b.thickness ?? 4;
    const color = b.color || '#b8860b';
    const secondaryColor = b.secondaryColor || (b.preset === 'classic-gold' || b.preset === 'ornate-royal' ? '#d4af37' : '#1e293b');
    const cornerDec = b.cornerDecoration !== false;

    // 1. CLASSIC GOLD FLOURISH
    if (b.preset === 'classic-gold') {
      return (
        <div className="absolute inset-0 pointer-events-none" style={{ padding: `${pad}px` }}>
          <div
            className="relative w-full h-full"
            style={{
              border: `${thickness}px solid ${color}`,
              borderRadius: `${b.cornerRadius || 4}px`
            }}
          >
            {/* Inner Gold Keyline */}
            <div
              className="absolute inset-2"
              style={{
                border: `1.5px solid ${secondaryColor}`,
                opacity: 0.9
              }}
            />

            {/* Inner-most hairline */}
            <div
              className="absolute inset-3.5"
              style={{
                border: `0.75px solid ${color}`,
                opacity: 0.45
              }}
            />

            {cornerDec && (
              <>
                {/* Top-Left Classic Flourish */}
                <div className="absolute top-1 left-1 w-12 h-12 pointer-events-none">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    <path d="M0,0 L35,0 C22,2 12,12 8,24 C6,30 2,35 0,35 Z" fill={color} />
                    <path d="M4,4 L28,4 C18,7 10,15 7,24 C5,29 3,31 2,31 Z" fill={secondaryColor} opacity="0.6" />
                    <circle cx="16" cy="16" r="3.5" fill={color} />
                    <circle cx="16" cy="16" r="1.5" fill={secondaryColor} />
                    <path d="M22,6 C16,10 10,16 6,22" stroke={color} strokeWidth="1.5" fill="none" />
                    <circle cx="28" cy="8" r="1.5" fill={color} />
                    <circle cx="8" cy="28" r="1.5" fill={color} />
                  </svg>
                </div>

                {/* Top-Right Classic Flourish */}
                <div className="absolute top-1 right-1 w-12 h-12 pointer-events-none rotate-90">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    <path d="M0,0 L35,0 C22,2 12,12 8,24 C6,30 2,35 0,35 Z" fill={color} />
                    <path d="M4,4 L28,4 C18,7 10,15 7,24 C5,29 3,31 2,31 Z" fill={secondaryColor} opacity="0.6" />
                    <circle cx="16" cy="16" r="3.5" fill={color} />
                    <circle cx="16" cy="16" r="1.5" fill={secondaryColor} />
                    <path d="M22,6 C16,10 10,16 6,22" stroke={color} strokeWidth="1.5" fill="none" />
                    <circle cx="28" cy="8" r="1.5" fill={color} />
                    <circle cx="8" cy="28" r="1.5" fill={color} />
                  </svg>
                </div>

                {/* Bottom-Left Classic Flourish */}
                <div className="absolute bottom-1 left-1 w-12 h-12 pointer-events-none -rotate-90">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    <path d="M0,0 L35,0 C22,2 12,12 8,24 C6,30 2,35 0,35 Z" fill={color} />
                    <path d="M4,4 L28,4 C18,7 10,15 7,24 C5,29 3,31 2,31 Z" fill={secondaryColor} opacity="0.6" />
                    <circle cx="16" cy="16" r="3.5" fill={color} />
                    <circle cx="16" cy="16" r="1.5" fill={secondaryColor} />
                    <path d="M22,6 C16,10 10,16 6,22" stroke={color} strokeWidth="1.5" fill="none" />
                    <circle cx="28" cy="8" r="1.5" fill={color} />
                    <circle cx="8" cy="28" r="1.5" fill={color} />
                  </svg>
                </div>

                {/* Bottom-Right Classic Flourish */}
                <div className="absolute bottom-1 right-1 w-12 h-12 pointer-events-none rotate-180">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    <path d="M0,0 L35,0 C22,2 12,12 8,24 C6,30 2,35 0,35 Z" fill={color} />
                    <path d="M4,4 L28,4 C18,7 10,15 7,24 C5,29 3,31 2,31 Z" fill={secondaryColor} opacity="0.6" />
                    <circle cx="16" cy="16" r="3.5" fill={color} />
                    <circle cx="16" cy="16" r="1.5" fill={secondaryColor} />
                    <path d="M22,6 C16,10 10,16 6,22" stroke={color} strokeWidth="1.5" fill="none" />
                    <circle cx="28" cy="8" r="1.5" fill={color} />
                    <circle cx="8" cy="28" r="1.5" fill={color} />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // 2. DOUBLE ACADEMIC FRAME (Collegiate Oxford/Harvard Style)
    if (b.preset === 'double-academic') {
      const heavyWidth = Math.max(5, thickness + 2);
      return (
        <div className="absolute inset-0 pointer-events-none" style={{ padding: `${pad}px` }}>
          {/* Outer Heavy Collegiate Band */}
          <div
            className="relative w-full h-full"
            style={{
              border: `${heavyWidth}px solid ${color}`
            }}
          >
            {/* 4px Academic White Air Gap + Inner Thin Scholastic Line */}
            <div
              className="absolute inset-1.5"
              style={{
                border: `2px solid ${secondaryColor || color}`
              }}
            />

            {/* Inset Hairline Detail */}
            <div
              className="absolute inset-3"
              style={{
                border: `1px solid ${color}`,
                opacity: 0.5
              }}
            />

            {cornerDec && (
              <>
                {/* 4 Academic Corner Blocks with Rosette Squares */}
                {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-7 h-7 pointer-events-none`}>
                    <svg viewBox="0 0 28 28" className="w-full h-full">
                      <rect x="0" y="0" width="28" height="28" fill={color} />
                      <rect x="3" y="3" width="22" height="22" fill="#ffffff" />
                      <rect x="6" y="6" width="16" height="16" fill={color} />
                      <rect x="9" y="9" width="10" height="10" fill={secondaryColor || '#ffffff'} />
                      <polygon points="14,9 19,14 14,19 9,14" fill="#ffffff" />
                    </svg>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      );
    }

    // 3. GEOMETRIC TECH FRAME (Cyber, Engineering & Modern Tech)
    if (b.preset === 'geometric-tech') {
      return (
        <div className="absolute inset-0 pointer-events-none" style={{ padding: `${pad}px` }}>
          <div className="relative w-full h-full">
            {/* SVG Vector Tech Frame with Chamfered Corners, Reticles & Segmented Lines */}
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Outer Cut-Corner Polygon */}
              <polygon
                points="24,0 calc(100% - 24px),0 100%,24 100%,calc(100% - 24px) calc(100% - 24px),100% 24,100% 0,calc(100% - 24px) 0,24"
                fill="none"
                stroke={color}
                strokeWidth={thickness}
              />

              {/* Inner High-Tech Offset Cyan/Accent Line */}
              <polygon
                points="30,8 calc(100% - 30px),8 calc(100% - 8px),30 calc(100% - 8px),calc(100% - 30px) calc(100% - 30px),calc(100% - 8px) 30,calc(100% - 8px) 8,calc(100% - 30px) 8,30"
                fill="none"
                stroke={secondaryColor || '#38bdf8'}
                strokeWidth="1.5"
                strokeDasharray="16, 6"
              />
            </svg>

            {/* Corner Crosshair Reticles & Nodes */}
            {cornerDec && (
              <>
                {/* Top-Left Reticle */}
                <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none">
                  <div className="absolute top-0 left-0 w-4 h-1 bg-current" style={{ color }} />
                  <div className="absolute top-0 left-0 w-1 h-4 bg-current" style={{ color }} />
                  <div className="absolute top-2 left-2 text-[8px] font-mono font-bold" style={{ color: secondaryColor || color }}>
                    +
                  </div>
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor || color }} />
                </div>

                {/* Top-Right Reticle */}
                <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                  <div className="absolute top-0 right-0 w-4 h-1 bg-current" style={{ color }} />
                  <div className="absolute top-0 right-0 w-1 h-4 bg-current" style={{ color }} />
                  <div className="absolute top-2 right-2 text-[8px] font-mono font-bold" style={{ color: secondaryColor || color }}>
                    +
                  </div>
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor || color }} />
                </div>

                {/* Bottom-Left Reticle */}
                <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none">
                  <div className="absolute bottom-0 left-0 w-4 h-1 bg-current" style={{ color }} />
                  <div className="absolute bottom-0 left-0 w-1 h-4 bg-current" style={{ color }} />
                  <div className="absolute bottom-2 left-2 text-[8px] font-mono font-bold" style={{ color: secondaryColor || color }}>
                    +
                  </div>
                  <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor || color }} />
                </div>

                {/* Bottom-Right Reticle */}
                <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none">
                  <div className="absolute bottom-0 right-0 w-4 h-1 bg-current" style={{ color }} />
                  <div className="absolute bottom-0 right-0 w-1 h-4 bg-current" style={{ color }} />
                  <div className="absolute bottom-2 right-2 text-[8px] font-mono font-bold" style={{ color: secondaryColor || color }}>
                    +
                  </div>
                  <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: secondaryColor || color }} />
                </div>

                {/* Cyber Center Ruler Ticks */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-white/90 dark:bg-slate-900/90 text-[7px] font-mono uppercase tracking-widest border" style={{ borderColor: color, color }}>
                  SECURE CRYPTO CREDENTIAL
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // 4. MODERN MINIMAL KEYLINE (Clean, Swiss Bauhaus, Contemporary)
    if (b.preset === 'modern-minimal') {
      return (
        <div className="absolute inset-0 pointer-events-none" style={{ padding: `${pad}px` }}>
          <div className="relative w-full h-full">
            {/* Open Floating Corner Frame: Lines stop 20px before corners */}
            {/* Top Bar */}
            <div className="absolute top-0 left-6 right-6 h-[1.5px]" style={{ backgroundColor: color }} />
            {/* Bottom Bar */}
            <div className="absolute bottom-0 left-6 right-6 h-[1.5px]" style={{ backgroundColor: color }} />
            {/* Left Bar */}
            <div className="absolute left-0 top-6 bottom-6 w-[1.5px]" style={{ backgroundColor: color }} />
            {/* Right Bar */}
            <div className="absolute right-0 top-6 bottom-6 w-[1.5px]" style={{ backgroundColor: color }} />

            {/* Inner Floating Subtle Accent Box */}
            <div
              className="absolute inset-3.5"
              style={{
                border: `0.75px solid ${secondaryColor || color}`,
                opacity: 0.35
              }}
            />

            {cornerDec && (
              <>
                {/* 4 Minimalist Corner Intersection Crosses */}
                <div className="absolute top-0 left-0 w-4 h-4 flex items-center justify-center font-mono text-[11px] font-light" style={{ color }}>
                  +
                </div>
                <div className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center font-mono text-[11px] font-light" style={{ color }}>
                  +
                </div>
                <div className="absolute bottom-0 left-0 w-4 h-4 flex items-center justify-center font-mono text-[11px] font-light" style={{ color }}>
                  +
                </div>
                <div className="absolute bottom-0 right-0 w-4 h-4 flex items-center justify-center font-mono text-[11px] font-light" style={{ color }}>
                  +
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // 5. ORNATE ROYAL ROSETTE (Baroque Monarch / Grand Diplomatic Guilloche)
    if (b.preset === 'ornate-royal') {
      return (
        <div className="absolute inset-0 pointer-events-none" style={{ padding: `${pad}px` }}>
          <div
            className="relative w-full h-full"
            style={{
              border: `${Math.max(6, thickness + 2)}px double ${color}`,
              boxShadow: `inset 0 0 0 2px ${secondaryColor || '#d4af37'}`
            }}
          >
            {/* Guilloche Lace Accent Ribbon */}
            <div
              className="absolute inset-2"
              style={{
                border: `1.5px dashed ${secondaryColor || '#d4af37'}`,
                opacity: 0.8
              }}
            />

            {/* Inner Gold Keyline */}
            <div
              className="absolute inset-3.5"
              style={{
                border: `1px solid ${color}`,
                opacity: 0.6
              }}
            />

            {cornerDec && (
              <>
                {/* 4 Grand Royal Rosettes */}
                {/* Top-Left Rosette */}
                <div className="absolute -top-3 -left-3 w-14 h-14 pointer-events-none">
                  <svg viewBox="0 0 64 64" className="w-full h-full">
                    <circle cx="32" cy="32" r="28" fill="#ffffff" stroke={color} strokeWidth="2" />
                    <circle cx="32" cy="32" r="23" fill="none" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="3,2" />
                    <circle cx="32" cy="32" r="18" fill={color} />
                    <circle cx="32" cy="32" r="14" fill="#ffffff" />
                    <polygon points="32,20 35,29 44,32 35,35 32,44 29,35 20,32 29,29" fill={color} />
                    <circle cx="32" cy="32" r="3" fill={secondaryColor} />
                  </svg>
                </div>

                {/* Top-Right Rosette */}
                <div className="absolute -top-3 -right-3 w-14 h-14 pointer-events-none">
                  <svg viewBox="0 0 64 64" className="w-full h-full">
                    <circle cx="32" cy="32" r="28" fill="#ffffff" stroke={color} strokeWidth="2" />
                    <circle cx="32" cy="32" r="23" fill="none" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="3,2" />
                    <circle cx="32" cy="32" r="18" fill={color} />
                    <circle cx="32" cy="32" r="14" fill="#ffffff" />
                    <polygon points="32,20 35,29 44,32 35,35 32,44 29,35 20,32 29,29" fill={color} />
                    <circle cx="32" cy="32" r="3" fill={secondaryColor} />
                  </svg>
                </div>

                {/* Bottom-Left Rosette */}
                <div className="absolute -bottom-3 -left-3 w-14 h-14 pointer-events-none">
                  <svg viewBox="0 0 64 64" className="w-full h-full">
                    <circle cx="32" cy="32" r="28" fill="#ffffff" stroke={color} strokeWidth="2" />
                    <circle cx="32" cy="32" r="23" fill="none" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="3,2" />
                    <circle cx="32" cy="32" r="18" fill={color} />
                    <circle cx="32" cy="32" r="14" fill="#ffffff" />
                    <polygon points="32,20 35,29 44,32 35,35 32,44 29,35 20,32 29,29" fill={color} />
                    <circle cx="32" cy="32" r="3" fill={secondaryColor} />
                  </svg>
                </div>

                {/* Bottom-Right Rosette */}
                <div className="absolute -bottom-3 -right-3 w-14 h-14 pointer-events-none">
                  <svg viewBox="0 0 64 64" className="w-full h-full">
                    <circle cx="32" cy="32" r="28" fill="#ffffff" stroke={color} strokeWidth="2" />
                    <circle cx="32" cy="32" r="23" fill="none" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="3,2" />
                    <circle cx="32" cy="32" r="18" fill={color} />
                    <circle cx="32" cy="32" r="14" fill="#ffffff" />
                    <polygon points="32,20 35,29 44,32 35,35 32,44 29,35 20,32 29,29" fill={color} />
                    <circle cx="32" cy="32" r="3" fill={secondaryColor} />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // Default Fallback Frame
    return (
      <div className="absolute inset-0 pointer-events-none" style={{ padding: `${pad}px` }}>
        <div
          className="relative w-full h-full"
          style={{
            border: `${thickness}px solid ${color}`,
            borderRadius: `${b.cornerRadius || 0}px`
          }}
        >
          <div className="absolute inset-2" style={{ border: `1px solid ${secondaryColor}`, opacity: 0.8 }} />
        </div>
      </div>
    );
  };

  // Background pattern rendering
  const renderBackgroundPattern = () => {
    if (template.backgroundPattern === 'guilloche') {
      return (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(${template.border.color} 1px, transparent 1px), radial-gradient(${template.border.color} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          }}
        />
      );
    }
    if (template.backgroundPattern === 'dots') {
      return (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(#000 1.5px, transparent 1.5px)`,
            backgroundSize: '16px 16px'
          }}
        />
      );
    }
    if (template.backgroundPattern === 'lines') {
      return (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)`,
            backgroundSize: '30px 30px',
            backgroundPosition: '0 0, 15px 15px'
          }}
        />
      );
    }
    return null;
  };

  // Watermark Emblem
  const renderWatermark = () => {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
        style={{ opacity: template.institution.watermarkOpacity || 0.06 }}
      >
        <div className="w-[420px] h-[420px] rounded-full border-[10px] border-slate-900/40 flex items-center justify-center p-8">
          <div className="w-full h-full rounded-full border-[3px] border-dashed border-slate-900/40 flex flex-col items-center justify-center text-center">
            <svg viewBox="0 0 100 100" className="w-32 h-32 fill-slate-900/60 mb-2">
              <path d="M50,5 L85,25 L85,65 C85,82 50,95 50,95 C50,95 15,82 15,65 L15,25 Z" fill="none" stroke="currentColor" strokeWidth="4" />
              <path d="M50,22 L72,35 L72,62 C72,74 50,83 50,83 C50,83 28,74 28,62 L28,35 Z" fill="currentColor" opacity="0.3" />
              <circle cx="50" cy="50" r="12" fill="currentColor" />
            </svg>
            <span className="text-[12px] font-cinzel font-bold tracking-widest uppercase text-slate-900">
              {template.institution.shortName || template.institution.name}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Render an individual element
  const renderElement = (el: CanvasElement) => {
    if (el.hidden) return null;

    const isSelected = selectedElementId === el.id;
    const isThisDragging = activeDragId === el.id && isDragging;
    const isThisResizing = activeResizeId === el.id && isResizing;
    const isThisInlineEditing = inlineEditId === el.id;
    const interpolatedContent = interpolateText(el.content, contextData);

    const currentX = isThisDragging && liveDragCoords ? liveDragCoords.x : el.x;
    const currentY = isThisDragging && liveDragCoords ? liveDragCoords.y : el.y;
    const currentWidth = isThisResizing && liveResizeWidth !== null ? liveResizeWidth : el.width;

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${currentX}%`,
      top: `${currentY}%`,
      transform: 'translate(-50%, -50%)',
      width: currentWidth ? `${currentWidth}%` : 'auto',
      color: el.color || 'inherit',
      fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
      fontWeight: el.fontWeight || undefined,
      fontFamily: el.fontFamily || undefined,
      fontStyle: el.fontStyle || 'normal',
      textDecoration: el.textDecoration || 'none',
      textAlign: el.textAlign || 'center',
      letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
      lineHeight: el.lineHeight || 1.3,
      opacity: el.opacity !== undefined ? el.opacity : 1,
      zIndex: isSelected ? 40 : el.zIndex || 10,
      cursor: interactive ? (isThisDragging ? 'grabbing' : 'grab') : 'default',
      userSelect: 'none'
    };

    let innerContent: React.ReactNode = interpolatedContent;

    // Special element rendering
    if (isThisInlineEditing) {
      innerContent = (
        <div className="w-full flex items-center justify-center p-1" onClick={(e) => e.stopPropagation()}>
          <textarea
            autoFocus
            rows={Math.max(1, Math.min(4, Math.ceil(inlineEditText.length / 40)))}
            value={inlineEditText}
            onChange={(e) => setInlineEditText(e.target.value)}
            onBlur={handleCommitInlineEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCommitInlineEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setInlineEditId(null);
              }
            }}
            style={{
              fontFamily: el.fontFamily || 'inherit',
              fontSize: el.fontSize ? `${el.fontSize}px` : 'inherit',
              fontWeight: el.fontWeight || 'inherit',
              textAlign: el.textAlign || 'center',
              color: el.color || '#0f172a'
            }}
            className="w-full bg-white/95 rounded border-2 border-indigo-600 p-2 shadow-2xl outline-none resize-none"
          />
        </div>
      );
    } else if (el.type === 'line' || el.type === 'divider') {
      innerContent = (
        <div
          style={{
            width: '100%',
            height: `${el.borderWidth || 1}px`,
            backgroundColor: el.borderColor || '#cbd5e1'
          }}
        />
      );
    } else if (el.type === 'logo' || el.type === 'image') {
      const logoSrc = el.url || template.institution.primaryLogoUrl || '/logo.png';
      innerContent = (
        <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={el.label || 'Institutional Logo'}
              className="max-h-full max-w-full object-contain drop-shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-12 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400">
              [ Institutional Logo ]
            </div>
          )}
        </div>
      );
    } else if (el.type === 'badge') {
      innerContent = (
        <div
          className="inline-flex items-center justify-center px-4 py-1 rounded-full border border-current shadow-xs pointer-events-none"
          style={{
            fontSize: `${el.fontSize || 10}px`,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            backgroundColor: 'rgba(255,255,255,0.85)'
          }}
        >
          ★ {interpolatedContent} ★
        </div>
      );
    } else if (el.type === 'qrCode') {
      const qrDataUrl = contextData.qrDataUrl;
      innerContent = (
        <div className="flex flex-col items-center justify-center pointer-events-none">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="Verification QR"
              className="w-16 h-16 rounded border border-slate-200 bg-white p-0.5 shadow-xs"
            />
          ) : (
            <div className="w-16 h-16 rounded border border-slate-300 bg-white p-1 flex flex-col items-center justify-center shadow-xs">
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[9px] font-mono text-slate-600 font-bold border border-slate-300">
                [ QR ]
              </div>
            </div>
          )}
          <span className="text-[7.5px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
            Scan to Verify
          </span>
        </div>
      );
    }

    return (
      <div
        key={el.id}
        style={style}
        onPointerDown={(e) => handleStartDrag(e, el)}
        onDoubleClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          if (el.type !== 'line' && el.type !== 'divider' && el.type !== 'logo') {
            setInlineEditId(el.id);
            setInlineEditText(el.content);
          }
        }}
        className={`group transition-shadow duration-75 relative ${
          isSelected && interactive
            ? 'ring-2 ring-indigo-500 ring-offset-2 rounded-sm shadow-md'
            : interactive
            ? 'hover:ring-1 hover:ring-indigo-300 hover:ring-offset-1 rounded-sm'
            : ''
        }`}
      >
        {/* Floating Quick Action Toolbar when element is selected */}
        {isSelected && interactive && !isThisDragging && !isThisInlineEditing && (
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 rounded-lg bg-slate-900/95 px-2 py-1 text-white shadow-xl backdrop-blur-xs text-[11px] animate-in fade-in zoom-in-95 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className="font-mono text-[9.5px] text-indigo-300 px-1 border-r border-slate-700">
              X:{Math.round(el.x)}% Y:{Math.round(el.y)}%
            </span>

            {/* Center Horizontally */}
            <button
              type="button"
              onClick={() => onUpdateElementPosition?.(el.id, 50, el.y, true)}
              title="Center Horizontally (50%)"
              className="rounded p-1 hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <AlignCenter className="h-3 w-3" />
            </button>

            {/* Edit Text */}
            {el.type !== 'line' && el.type !== 'divider' && el.type !== 'logo' && (
              <button
                type="button"
                onClick={() => {
                  setInlineEditId(el.id);
                  setInlineEditText(el.content);
                }}
                title="Edit Text Inline"
                className="rounded p-1 hover:bg-slate-800 text-slate-300 hover:text-white"
              >
                <Edit3 className="h-3 w-3" />
              </button>
            )}

            {/* Duplicate */}
            <button
              type="button"
              onClick={() => onDuplicateElement?.(el.id)}
              title="Duplicate Element"
              className="rounded p-1 hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <Copy className="h-3 w-3" />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={() => onDeleteElement?.(el.id)}
              title="Delete Element"
              className="rounded p-1 hover:bg-rose-950 text-rose-400 hover:text-rose-200"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Live Coordinate Pill while dragging */}
        {isThisDragging && liveDragCoords && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-50 rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-mono font-bold text-white shadow-lg pointer-events-none whitespace-nowrap">
            X: {liveDragCoords.x.toFixed(1)}% &bull; Y: {liveDragCoords.y.toFixed(1)}%
          </div>
        )}

        {/* Corner Drag Accent Handles for selected element */}
        {isSelected && interactive && (
          <>
            <div className="absolute -top-1 -left-1 w-2 h-2 rounded-xs bg-indigo-600 border border-white pointer-events-none" />
            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-xs bg-indigo-600 border border-white pointer-events-none" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 rounded-xs bg-indigo-600 border border-white pointer-events-none" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-xs bg-indigo-600 border border-white pointer-events-none" />

            {/* Width Resizing Handle on the Right edge */}
            <div
              onPointerDown={(e) => handleStartResize(e, el)}
              title="Drag horizontally to resize element width"
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-6 rounded-sm bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center cursor-ew-resize hover:scale-110 z-40 transition-transform"
            >
              <div className="w-0.5 h-3 bg-white rounded-full" />
            </div>
          </>
        )}

        {innerContent}
      </div>
    );
  };

  // Render Signatures
  const renderSignatures = () => {
    if (!template.signatures || template.signatures.length === 0) return null;

    return (
      <div
        className="absolute bottom-10 left-0 right-0 px-16 flex items-end justify-between pointer-events-none"
        style={{ zIndex: 20 }}
      >
        {template.signatures.map((sig, idx) => {
          const cleanName = sig.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, '');
          return (
            <div
              key={sig.id || idx}
              className="flex flex-col items-center text-center min-w-[180px] pointer-events-auto"
            >
              {/* Signature Visual (Script or Uploaded/Drawn Image) */}
              <div className="h-12 flex items-center justify-center mb-1">
                {sig.signatureImage ? (
                  <img
                    src={sig.signatureImage}
                    alt={sig.name}
                    className="max-h-12 max-w-full object-contain drop-shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : sig.signatureStyle === 'script-1' ? (
                  <span className="font-greatvibes text-3xl text-slate-900 select-none">
                    {cleanName}
                  </span>
                ) : sig.signatureStyle === 'script-2' ? (
                  <span className="font-alexbrush text-3xl text-slate-900 select-none">
                    {cleanName}
                  </span>
                ) : sig.signatureStyle === 'script-4' ? (
                  <span className="text-2xl italic font-serif text-slate-900 select-none font-bold">
                    {cleanName}
                  </span>
                ) : (
                  <span className="font-pinyon text-4xl text-slate-900 select-none">
                    {cleanName}
                  </span>
                )}
              </div>

              {/* Signature Line */}
              <div className="w-44 h-0.5 bg-slate-400 mb-1.5" />

              {/* Name and Title */}
              <p className="text-xs font-montserrat font-bold text-slate-800 tracking-wide">
                {sig.name}
              </p>
              <p className="text-[10px] font-montserrat text-slate-600">
                {sig.designation}
              </p>
              {sig.department && (
                <p className="text-[9px] font-montserrat text-slate-500">
                  {sig.department}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Institutional Header Logo if enabled and not already explicitly added as a custom canvas element
  const renderInstitutionalLogoHeader = () => {
    const inst = template.institution;
    if (inst.showLogoOnCertificate === false || !inst.primaryLogoUrl) return null;
    const hasExplicitLogo = template.elements.some((e) => !e.hidden && (e.type === 'logo' || e.type === 'image'));
    if (hasExplicitLogo) return null;

    const pos = inst.logoPosition || 'top-center';
    if (pos === 'watermark') return null;

    let left = '50%';
    let top = '9.5%';
    if (pos === 'top-left') {
      left = '14%';
    } else if (pos === 'top-right') {
      left = '86%';
    }

    const widthPct = inst.logoWidthPercent || 14;

    return (
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          left,
          top,
          transform: 'translate(-50%, -50%)',
          width: `${widthPct}%`,
          height: '46px',
          zIndex: 15
        }}
      >
        <img
          src={inst.primaryLogoUrl}
          alt={inst.name || 'Institutional Logo'}
          className="max-h-full max-w-full object-contain drop-shadow-xs"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  // Render Official Seal / Stamp
  const renderStamp = () => {
    const stamp = template.stamp;
    if (!stamp || !stamp.enabled) return null;

    const posX = stamp.x || 50;
    const posY = stamp.y || 83;

    return (
      <div
        className="absolute pointer-events-none select-none flex items-center justify-center"
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          transform: `translate(-50%, -50%) rotate(${stamp.rotation || 0}deg) scale(${stamp.scale || 1})`,
          opacity: stamp.opacity !== undefined ? stamp.opacity : 0.9,
          zIndex: 25
        }}
      >
        {/* Ornate Gold / Crimson Wax Seal Emblem */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer Starburst Scallop */}
          <div
            className="w-full h-full rounded-full flex items-center justify-center shadow-md"
            style={{
              background:
                stamp.type === 'seal'
                  ? 'radial-gradient(circle at 35% 35%, #ffd700, #b8860b 70%, #8b6508)'
                  : stamp.type === 'college'
                  ? 'radial-gradient(circle at 35% 35%, #f43f5e, #be123c 70%, #881337)'
                  : 'radial-gradient(circle at 35% 35%, #38bdf8, #0284c7 70%, #0369a1)',
              border: '3px solid rgba(255,255,255,0.5)'
            }}
          >
            {/* Inner Ring */}
            <div className="w-[86%] h-[86%] rounded-full border border-dashed border-white/80 flex flex-col items-center justify-center p-1 text-center text-white">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white mb-0.5">
                <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 16.1l-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 2z" />
              </svg>
              <span className="text-[7.5px] font-cinzel font-bold tracking-wider leading-tight uppercase">
                {stamp.label || 'OFFICIAL SEAL'}
              </span>
              <span className="text-[6.5px] font-montserrat tracking-widest uppercase opacity-90 mt-0.5">
                VERIFIED
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${baseWidth}px`,
        height: `${baseHeight}px`
      }}
      className="transition-transform duration-100 ease-out"
    >
      <div
        ref={setCanvasRef}
        id={`cert-canvas-${template.id}`}
        onClick={() => {
          if (interactive) {
            onSelectElement?.(null);
            setInlineEditId(null);
          }
        }}
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
          background: template.backgroundGradient || template.backgroundColor || '#ffffff',
          position: 'relative',
          boxShadow: '0 20px 45px -15px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          userSelect: interactive ? 'none' : 'auto'
        }}
        className="certificate-render-root"
      >
        {/* Dynamic Snap Guide Lines */}
        {snapGuide.x && (
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-l border-dashed border-indigo-600 z-30 pointer-events-none">
            <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow">
              CENTER 50%
            </span>
          </div>
        )}
        {snapGuide.y && (
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 border-t border-dashed border-indigo-600 z-30 pointer-events-none">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow">
              MIDDLE 50%
            </span>
          </div>
        )}

        {/* Background Pattern */}
        {renderBackgroundPattern()}

        {/* Watermark */}
        {renderWatermark()}

        {/* Framing Border */}
        {renderBorder()}

        {/* Institutional Header Logo */}
        {renderInstitutionalLogoHeader()}

        {/* Canvas Elements */}
        {template.elements.map((el) => renderElement(el))}

        {/* Signatures */}
        {renderSignatures()}

        {/* Seal / Stamp */}
        {renderStamp()}
      </div>
    </div>
  );
};
