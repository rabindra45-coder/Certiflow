import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2, Check, PenTool, Sparkles, Palette } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  initialImage?: string;
  width?: number;
  height?: number;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

const INK_COLORS = [
  { label: 'Midnight Navy', value: '#0f172a', class: 'bg-slate-900' },
  { label: 'Royal Blue', value: '#1d4ed8', class: 'bg-blue-700' },
  { label: 'Fountain Black', value: '#000000', class: 'bg-black' },
  { label: 'Academic Burgundy', value: '#831843', class: 'bg-pink-900' },
  { label: 'Executive Gold', value: '#b45309', class: 'bg-amber-700' }
];

const PEN_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 3.5 },
  { label: 'Bold', value: 5.5 }
];

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  initialImage,
  width = 600,
  height = 240
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#0f172a');
  const [selectedWidth, setSelectedWidth] = useState<number>(3.5);
  const [hasContent, setHasContent] = useState<boolean>(Boolean(initialImage));

  // Redraw canvas from strokes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear with transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render baseline guideline
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 45);
    ctx.lineTo(canvas.width - 30, canvas.height - 45);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('Authorized Signature Baseline', 32, canvas.height - 25);
    ctx.restore();

    // Render completed strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length - 1; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }

      const lastPoint = stroke.points[stroke.points.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
      ctx.stroke();
      ctx.restore();
    });

    // Render current active stroke
    if (currentStroke.length > 1) {
      ctx.save();
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = selectedWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);

      for (let i = 1; i < currentStroke.length - 1; i++) {
        const xc = (currentStroke[i].x + currentStroke[i + 1].x) / 2;
        const yc = (currentStroke[i].y + currentStroke[i + 1].y) / 2;
        ctx.quadraticCurveTo(currentStroke[i].x, currentStroke[i].y, xc, yc);
      }

      const lastPoint = currentStroke[currentStroke.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
      ctx.stroke();
      ctx.restore();
    }
  }, [strokes, currentStroke, selectedColor, selectedWidth]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Canvas Coordinate Helper
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    if (!pt) return;
    setIsDrawing(true);
    setCurrentStroke([pt]);
    setHasContent(true);
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    setCurrentStroke((prev) => [...prev, pt]);
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      setStrokes((prev) => [
        ...prev,
        {
          points: currentStroke,
          color: selectedColor,
          width: selectedWidth
        }
      ]);
    }
    setCurrentStroke([]);
  };

  const handleUndo = () => {
    setStrokes((prev) => {
      const next = prev.slice(0, prev.length - 1);
      if (next.length === 0) setHasContent(false);
      return next;
    });
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    setHasContent(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || strokes.length === 0) return;

    // Create a trimmed export without the guidelines
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    // Render only strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      exportCtx.save();
      exportCtx.strokeStyle = stroke.color;
      exportCtx.lineWidth = stroke.width;
      exportCtx.lineCap = 'round';
      exportCtx.lineJoin = 'round';

      exportCtx.beginPath();
      exportCtx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length - 1; i++) {
        const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
        const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
        exportCtx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
      }

      const lastPoint = stroke.points[stroke.points.length - 1];
      exportCtx.lineTo(lastPoint.x, lastPoint.y);
      exportCtx.stroke();
      exportCtx.restore();
    });

    const dataUrl = exportCanvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="space-y-4">
      {/* Tool Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/60">
        {/* Ink Colors */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Palette className="h-3 w-3" /> Ink:
          </span>
          {INK_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setSelectedColor(c.value)}
              className={`h-6 w-6 rounded-full border transition-all ${c.class} ${
                selectedColor === c.value
                  ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110'
                  : 'border-white/50 opacity-80 hover:opacity-100'
              }`}
              title={c.label}
            />
          ))}
        </div>

        {/* Stroke Widths */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
          {PEN_WIDTHS.map((pw) => (
            <button
              key={pw.value}
              type="button"
              onClick={() => setSelectedWidth(pw.value)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                selectedWidth === pw.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {pw.label}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Undo last stroke"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Undo</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasContent && strokes.length === 0}
            className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-40 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
            title="Clear signature pad"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Interactive Drawing Pad Area */}
      <div className="relative rounded-2xl border-2 border-dashed border-slate-300 bg-white overflow-hidden shadow-inner dark:border-slate-700 dark:bg-slate-950">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          onTouchCancel={handleEnd}
          className="touch-none w-full h-[220px] cursor-crosshair block"
        />

        {!hasContent && strokes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
            <PenTool className="h-8 w-8 mb-1.5 opacity-40 animate-pulse" />
            <p className="text-xs font-medium">Sign or draw with your finger, mouse, or stylus here</p>
          </div>
        )}
      </div>

      {/* Apply / Confirmation */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-500">
          Saved signatures are automatically converted to transparent vector credentials.
        </span>
        <button
          type="button"
          onClick={handleExport}
          disabled={strokes.length === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-40 transition-all"
        >
          <Check className="h-3.5 w-3.5" />
          Apply Drawn Signature
        </button>
      </div>
    </div>
  );
};
