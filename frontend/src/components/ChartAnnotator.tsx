import { ActionIcon, Box, Button, Group, Stack, Text } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { type PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import type { ChartBoxes, ChartBoxKind } from "../data/uploaded-chart";
import type { Bbox } from "../types/visualization-types";

type Props = {
    src: string;
    boxes: ChartBoxes;
    onChange: (boxes: ChartBoxes) => void;
    /** Blocks edits, so the boxes can't change after they've been submitted. */
    disabled?: boolean;
};

type Point = { x: number; y: number };

// Colors keep at least 4.5:1 against the white label text. Every box also
// carries its name, so color is never the only way to tell them apart.
const TOOLS: {
    kind: ChartBoxKind;
    label: string;
    color: string;
    hint: string;
}[] = [
    {
        kind: "horizontalAxis",
        label: "Horizontal axis",
        color: "#1864ab",
        hint: "the horizontal axis, including its tick labels and title",
    },
    {
        kind: "verticalAxis",
        label: "Vertical axis",
        color: "#a61e4d",
        hint: "the vertical axis, including its tick labels and title",
    },
    {
        kind: "legend",
        label: "Legend",
        color: "#1e7a36",
        hint: "the legend",
    },
];

// Drags smaller than this are stray clicks, not boxes.
const MIN_BOX_PX = 6;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const toBbox = (a: Point, b: Point): Bbox => ({
    x1: Math.min(a.x, b.x),
    y1: Math.min(a.y, b.y),
    x2: Math.max(a.x, b.x),
    y2: Math.max(a.y, b.y),
});

const DrawnBox = ({
    bbox,
    label,
    color,
}: {
    bbox: Bbox;
    label: string;
    color: string;
}) => (
    <Box
        style={{
            position: "absolute",
            left: `${bbox.x1 * 100}%`,
            top: `${bbox.y1 * 100}%`,
            width: `${(bbox.x2 - bbox.x1) * 100}%`,
            height: `${(bbox.y2 - bbox.y1) * 100}%`,
            border: `2px solid ${color}`,
            background: `${color}26`,
            pointerEvents: "none",
        }}
    >
        <Text
            span
            size="xs"
            fw={600}
            c="white"
            style={{
                position: "absolute",
                // Keep the tag on the chart when the box touches an edge.
                ...(bbox.y1 < 0.08 ? { top: "100%" } : { bottom: "100%" }),
                ...(bbox.x1 > 0.7 ? { right: 0 } : { left: 0 }),
                background: color,
                padding: "1px 5px",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
            }}
        >
            {label}
        </Text>
    </Box>
);

/**
 * Lets the user mark a chart's axes and legend by dragging boxes over it. One
 * box per kind, because Dynamic Context has one slot for each: drawing again
 * replaces the box. Boxes are normalized 0..1 to the image.
 */
const ChartAnnotator = ({ src, boxes, onChange, disabled = false }: Props) => {
    const [activeKind, setActiveKind] =
        useState<ChartBoxKind>("horizontalAxis");
    const [draft, setDraft] = useState<Bbox | null>(null);
    const dragStart = useRef<Point | null>(null);

    const activeTool = TOOLS.find((tool) => tool.kind === activeKind)!;

    const pointFromEvent = (e: ReactPointerEvent<HTMLDivElement>): Point => {
        const rect = e.currentTarget.getBoundingClientRect();
        return {
            x: clamp01((e.clientX - rect.left) / rect.width),
            y: clamp01((e.clientY - rect.top) / rect.height),
        };
    };

    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (disabled || e.button !== 0) return;
        // Keeps the drag alive when the pointer leaves the image.
        e.currentTarget.setPointerCapture(e.pointerId);
        const start = pointFromEvent(e);
        dragStart.current = start;
        setDraft(toBbox(start, start));
    };

    const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!dragStart.current) return;
        setDraft(toBbox(dragStart.current, pointFromEvent(e)));
    };

    const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
        const start = dragStart.current;
        if (!start) return;
        dragStart.current = null;
        setDraft(null);

        const bbox = toBbox(start, pointFromEvent(e));
        const rect = e.currentTarget.getBoundingClientRect();
        if (
            (bbox.x2 - bbox.x1) * rect.width < MIN_BOX_PX ||
            (bbox.y2 - bbox.y1) * rect.height < MIN_BOX_PX
        ) {
            return;
        }

        const next = { ...boxes, [activeKind]: bbox };
        onChange(next);
        const nextTool = TOOLS.find((tool) => !next[tool.kind]);
        if (nextTool) setActiveKind(nextTool.kind);
    };

    const handlePointerCancel = () => {
        dragStart.current = null;
        setDraft(null);
    };

    const clearBox = (kind: ChartBoxKind) => {
        const next = { ...boxes };
        delete next[kind];
        onChange(next);
        setActiveKind(kind);
    };

    return (
        <Stack gap="sm">
            <Group gap="sm">
                {TOOLS.map((tool) => (
                    <Group key={tool.kind} gap={2} wrap="nowrap">
                        <Button
                            size="sm"
                            color={tool.color}
                            variant={
                                tool.kind === activeKind ? "filled" : "default"
                            }
                            aria-pressed={tool.kind === activeKind}
                            disabled={disabled}
                            leftSection={
                                boxes[tool.kind] ? (
                                    <IconCheck size={16} aria-hidden />
                                ) : undefined
                            }
                            onClick={() => setActiveKind(tool.kind)}
                        >
                            {tool.label}
                        </Button>
                        {boxes[tool.kind] && (
                            <ActionIcon
                                size={36}
                                variant="subtle"
                                color="gray"
                                aria-label={`Remove ${tool.label} box`}
                                disabled={disabled}
                                onClick={() => clearBox(tool.kind)}
                            >
                                <IconX size={16} />
                            </ActionIcon>
                        )}
                    </Group>
                ))}
            </Group>

            <Text size="sm" aria-live="polite">
                {boxes[activeKind] ? "Drag to replace the box around " : "Drag a box around "}
                {activeTool.hint}.
            </Text>

            <Box style={{ display: "flex", justifyContent: "center" }}>
                <Box
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    style={{
                        position: "relative",
                        display: "inline-block",
                        lineHeight: 0,
                        maxWidth: "100%",
                        outline: "1px solid var(--oc-divider-strong)",
                        background: "var(--oc-chart-surface)",
                        cursor: disabled ? "default" : "crosshair",
                        touchAction: "none",
                        userSelect: "none",
                    }}
                >
                    <img
                        src={src}
                        alt="Uploaded chart"
                        draggable={false}
                        style={{
                            display: "block",
                            width: "auto",
                            height: "auto",
                            maxWidth: "100%",
                            maxHeight: "60vh",
                        }}
                    />
                    {TOOLS.map((tool) => {
                        const bbox =
                            draft && tool.kind === activeKind
                                ? draft
                                : boxes[tool.kind];
                        return (
                            bbox && (
                                <DrawnBox
                                    key={tool.kind}
                                    bbox={bbox}
                                    label={tool.label}
                                    color={tool.color}
                                />
                            )
                        );
                    })}
                </Box>
            </Box>
        </Stack>
    );
};

export default ChartAnnotator;
