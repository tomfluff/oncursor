// It should handle all conditions (baseline, minimap, and proposal)

import { Box, Image } from "@mantine/core";
import {
    type MouseEvent as ReactMouseEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import type { VisualizationData } from "../types/visualization-types";
import DynamicOverlay from "./DynamicOverlay";

type Props = {
    vizData: VisualizationData;
    onMouseMove?: (x: number, y: number, w: number, h: number) => void;
    onLoaded?: () => void;
    allowOverlay?: boolean;
    forceOverlay?: boolean;
    /**
     * When set (a CSS length, e.g. "calc(100vh - 210px)"), the image is
     * contained within this max-height and shrink-wrapped (instead of the
     * default 500px cap), so it fully fits its container without scrolling.
     */
    fitHeight?: string;
    /**
     * When true, left-clicking the chart drops the overlay's resting anchor at
     * that point (instead of the default click-to-hide-content behavior). The
     * forced overlay then rests there; a marker shows the anchor.
     */
    pinOnClick?: boolean;
    /** Notifies the parent whenever a pin is set or cleared. */
    onPinnedChange?: (pinned: boolean) => void;
    /** Changing this value clears the pin (resets the anchor to center). */
    clearPinToken?: number;
    /**
     * Current zoom scale of an ancestor CSS transform (e.g. from a zoom/pan
     * wrapper). The raw cursor coordinates come back multiplied by this scale,
     * so they are divided by it to recover the image's own coordinate space.
     */
    scale?: number;
};

const VisualizationPanel = (props: Props) => {
    const {
        vizData,
        onMouseMove,
        onLoaded,
        allowOverlay,
        forceOverlay,
        fitHeight,
        pinOnClick,
        onPinnedChange,
        clearPinToken,
        scale,
    } = props;

    const imageRef = useRef<HTMLImageElement>(null);
    const [cursorRest, setCursorRest] = useState({ x: 0, y: 0 });
    const [pos, setPos] = useState({ x: 0, y: 0 });

    // Cursor position in the image's own (unscaled) coordinate space. An
    // ancestor zoom transform scales the raw client coordinates, so the move
    // handler divides them by the current scale; the overlay is then re-scaled
    // by that same transform, keeping it locked to the cursor at any zoom.
    const s = scale && scale > 0 ? scale : 1;
    const cursorX = pos.x;
    const cursorY = pos.y;
    const isHover = pos.x > 0 || pos.y > 0;

    const handleMouseMove = (e: ReactMouseEvent) => {
        const el = imageRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / s;
        const y = (e.clientY - rect.top) / s;
        setPos({ x, y });
        onMouseMove?.(x, y, el.offsetWidth, el.offsetHeight);
    };

    const [isHideContent, setIsHideContent] = useState(false);
    const [hasPin, setHasPin] = useState(false);
    const [ripple, setRipple] = useState<{
        x: number;
        y: number;
        key: number;
    } | null>(null);
    const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const handlePointerDown = (e: PointerEvent) => {
            pointerDownPos.current = { x: e.clientX, y: e.clientY };
        };
        const handleClick = (e: MouseEvent) => {
            // Ignore clicks that were actually drags (e.g. panning a zoomed
            // chart) so they don't drop a pin.
            const moved =
                pointerDownPos.current &&
                Math.hypot(
                    e.clientX - pointerDownPos.current.x,
                    e.clientY - pointerDownPos.current.y,
                ) > 5;
            if (isHover && e.button === 0 && !moved) {
                if (pinOnClick) {
                    setCursorRest({ x: cursorX, y: cursorY });
                    setHasPin(true);
                    onPinnedChange?.(true);
                    setRipple({ x: cursorX, y: cursorY, key: Date.now() });
                } else {
                    setIsHideContent((prev) => !prev);
                }
            }
        };
        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("click", handleClick);
        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("click", handleClick);
        };
    }, [isHover, pinOnClick, cursorX, cursorY, onPinnedChange]);

    // Clear the pin (reset anchor to center) when the parent bumps the token.
    useEffect(() => {
        if (clearPinToken === undefined) return;
        if (imageRef.current) {
            setCursorRest({
                x: imageRef.current.offsetWidth / 2,
                y: imageRef.current.offsetHeight / 2,
            });
        }
        setHasPin(false);
        onPinnedChange?.(false);
        // Only react to token changes, not to ref/callback identity.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [clearPinToken]);

    return (
        <Box
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setPos({ x: 0, y: 0 })}
            style={
                fitHeight
                    ? {
                          position: "relative",
                          display: "inline-block",
                          lineHeight: 0,
                          maxWidth: "100%",
                      }
                    : { position: "relative" }
            }
            mah={fitHeight ? undefined : 500}
        >
            <Image
                ref={imageRef}
                src={vizData.pngUrl}
                alt="Visualization Image"
                fit="contain"
                {...(fitHeight
                    ? {
                          style: {
                              display: "block",
                              width: "auto",
                              height: "auto",
                              maxWidth: "100%",
                              maxHeight: fitHeight,
                          },
                      }
                    : { w: "100%", h: "auto" })}
                onLoad={() => {
                    if (imageRef.current) {
                        setCursorRest({
                            x: imageRef.current.offsetWidth / 2,
                            y: imageRef.current.offsetHeight / 2,
                        });
                        setHasPin(false);
                    }
                    onPinnedChange?.(false);
                    onLoaded?.();
                }}
                draggable={false}
            />
            {allowOverlay &&
                imageRef.current &&
                (forceOverlay || isHover) && ( // Show overlay if forceOverlay is true or if hovering
                    <DynamicOverlay
                        vizData={vizData}
                        containerRef={
                            imageRef as React.RefObject<HTMLImageElement>
                        }
                        cursorX={isHover ? cursorX : cursorRest.x}
                        cursorY={isHover ? cursorY : cursorRest.y}
                        isHovering={isHover}
                        isHideContent={isHideContent}
                    />
                )}
            {/* Pin marker: shows where the resting anchor sits */}
            {allowOverlay &&
                pinOnClick &&
                hasPin &&
                !isHover &&
                imageRef.current && (
                    <div
                        className="vg-pin"
                        style={{
                            left: `${cursorRest.x}px`,
                            top: `${cursorRest.y}px`,
                        }}
                    >
                        <span className="vg-pin-label">Focus pinned</span>
                        <span className="vg-pin-ring" />
                        <span className="vg-pin-dot" />
                    </div>
                )}
            {/* Click ripple: momentary feedback at the click location */}
            {allowOverlay && pinOnClick && ripple && (
                <span
                    key={ripple.key}
                    className="vg-click-ripple"
                    style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
                />
            )}
        </Box>
    );
};

export default VisualizationPanel;
