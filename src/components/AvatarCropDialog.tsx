import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type SyntheticEvent,
} from "react";

type Props = {
  open: boolean;
  file: File | null;
  onCancel: () => void;
  onSave: (dataUrl: string) => void | Promise<void>;
  busy?: boolean;
};

const OUT_SIZE = 256;

export default function AvatarCropDialog({ open, file, onCancel, onSave, busy }: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError("");
    return () => URL.revokeObjectURL(url);
  }, [open, file]);

  if (!open || !src) return null;

  function onImgLoad(e: SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    imgRef.current = img;
  }

  function baseScale() {
    if (!natural.w || !natural.h) return 1;
    // Cover the square crop viewport (280px css)
    const view = 280;
    return Math.max(view / natural.w, view / natural.h);
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  async function exportCrop() {
    const img = imgRef.current;
    if (!img || !natural.w) {
      setError("Image not ready");
      return;
    }
    const view = 280;
    const scale = baseScale() * zoom;
    const drawW = natural.w * scale;
    const drawH = natural.h * scale;
    const dx = (view - drawW) / 2 + offset.x;
    const dy = (view - drawH) / 2 + offset.y;

    const canvas = document.createElement("canvas");
    canvas.width = OUT_SIZE;
    canvas.height = OUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Could not crop");
      return;
    }

    ctx.clearRect(0, 0, OUT_SIZE, OUT_SIZE);
    ctx.beginPath();
    ctx.arc(OUT_SIZE / 2, OUT_SIZE / 2, OUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const ratio = OUT_SIZE / view;
    ctx.drawImage(img, dx * ratio, dy * ratio, drawW * ratio, drawH * ratio);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    await onSave(dataUrl);
  }

  const scale = baseScale() * zoom;
  const drawW = natural.w * scale;
  const drawH = natural.h * scale;

  return (
    <div className="crop-root" role="presentation">
      <button type="button" className="crop-backdrop" aria-label="Close" onClick={onCancel} />
      <div className="crop-sheet" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <h2 id="crop-title" className="crop-title">
          Crop avatar
        </h2>
        <p className="muted crop-hint">Drag to reposition. Pinch isn’t needed — use zoom.</p>

        <div
          className="crop-viewport"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {natural.w ? (
            <img
              ref={imgRef}
              src={src}
              alt=""
              className="crop-image"
              draggable={false}
              style={{
                width: drawW,
                height: drawH,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          ) : (
            <img src={src} alt="" className="crop-image-probe" onLoad={onImgLoad} />
          )}
          <div className="crop-mask" aria-hidden="true" />
        </div>

        <label className="crop-zoom">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <div className="crop-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void exportCrop()}
            disabled={busy || !natural.w}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
