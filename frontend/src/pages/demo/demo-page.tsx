import {
    ActionIcon,
    Anchor,
    Avatar,
    Box,
    Divider,
    Group,
    Image,
    List,
    Modal,
    Paper,
    Popover,
    ScrollArea,
    SegmentedControl,
    Stack,
    Text,
    Title,
    Tooltip,
    UnstyledButton,
} from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import {
    IconAdjustmentsHorizontal,
    IconBrandGithub,
    IconChevronUp,
    IconCircleOff,
    IconCrosshair,
    IconExternalLink,
    IconInfoCircle,
    IconLibrary,
    IconMap2,
    IconMapPin,
    IconPointer,
    IconUpload,
    IconX,
    IconZoomIn,
    IconZoomOut,
    IconZoomReset,
} from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import type { ConditionId } from "../../hooks/useUrlVariables";
import { useUrlVariables } from "../../hooks/useUrlVariables";
import {
    TransformComponent,
    TransformWrapper,
    type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import SettingsPanel from "../../components/SettingsPanel";
import useSessionStore from "../../stores/session-store";
import UploadModal from "../../components/UploadModal";
import VisualizationPanel from "../../components/VisualizationPanel";
import {
    DEMO_CHART_INDEX,
    DEMO_VIZ_BY_ID,
} from "../../data/demo-visualizations";
import type { VisualizationData } from "../../types/visualization-types";

const AUTHOR_URL = "https://tomfluff.github.io/";
const AUTHOR_IMG =
    "https://tomfluff.github.io/assets/img/prof_pic_color-480.webp";
const PROJECT_URL = "https://visual-context.github.io/";

const METHOD_INFO: Record<
    ConditionId,
    { label: string; icon: ReactNode; description: string }
> = {
    none: {
        label: "None",
        icon: <IconCircleOff size={16} />,
        description:
            "No assistive overlay — move your cursor freely over the chart.",
    },
    minimap: {
        label: "Mini-map",
        icon: <IconMap2 size={16} />,
        description:
            "A scaled-down copy of the whole chart sits in a corner, with an indicator marking your cursor's position.",
    },
    overview: {
        label: "Dynamic Context",
        icon: <IconCrosshair size={16} />,
        description:
            "The nearest axis labels and the legend follow your cursor, with a crosshair to keep you aligned.",
    },
};

// Short, plain-language descriptions of each chart type, keyed by label.
const CHART_DESC: Record<string, string> = {
    Treemap: "Nested rectangles sized by value",
    "100% Stacked Bar": "Category proportions adding to 100%",
    Histogram: "Distribution across value ranges",
    "Choropleth Map": "Regions shaded by value",
    "Pie Chart": "Parts of a whole",
    "Bubble Chart": "Three variables: x, y, and size",
    "Stacked Bar": "Categories split into sub-groups",
    "Line Chart": "Change over time",
    "Bar Chart": "Compare values across categories",
    "Area Chart": "Magnitude over time",
    "Stacked Area": "Composition over time",
    "Scatter Plot": "Relationship between two variables",
};

// The chart's own title (from its annotations), falling back to the type label.
const chartTitle = (vizId: string, fallback: string) =>
    DEMO_VIZ_BY_ID[vizId]?.annotations?.find((a) => a.type === "title")?.text ||
    fallback;

const DemoPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { conditionId } = useUrlVariables();
    const { ref: stageRef, height: stageHeight } = useElementSize();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [examplesOpen, setExamplesOpen] = useState(false);
    const [pinned, setPinned] = useState(false);
    const [clearPinToken, setClearPinToken] = useState(0);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const transformRef = useRef<ReactZoomPanPinchRef>(null);
    const [scale, setScale] = useState(1);
    const maxScale = 8;
    useEffect(() => {
        const STEP = 0.05;
        const handler = (e: KeyboardEvent) => {
            if (!e.ctrlKey) return;
            const { update, overlayWidth, overlayHeight } = useSessionStore.getState();
            if (e.key === "ArrowRight") { e.preventDefault(); update("overlayWidth", Math.min(1, overlayWidth.value + STEP)); }
            else if (e.key === "ArrowLeft") { e.preventDefault(); update("overlayWidth", Math.max(0, overlayWidth.value - STEP)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); update("overlayHeight", Math.min(1, overlayHeight.value + STEP)); }
            else if (e.key === "ArrowDown") { e.preventDefault(); update("overlayHeight", Math.max(0, overlayHeight.value - STEP)); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const selectedVizId = searchParams.get("viz") || DEMO_CHART_INDEX[0].vizId;
    const vizData = useMemo(
        () =>
            DEMO_VIZ_BY_ID[selectedVizId] ??
            DEMO_VIZ_BY_ID[DEMO_CHART_INDEX[0].vizId],
        [selectedVizId],
    );

    // A user-uploaded + analyzed chart, when present, overrides the selected
    // example. Only reachable when an analyzer endpoint is configured.
    const [uploadedViz, setUploadedViz] = useState<VisualizationData | null>(
        null,
    );
    const activeViz = uploadedViz ?? vizData;

    const updateParam = (key: string, value: string) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set(key, value);
                return next;
            },
            { replace: true },
        );
    };

    const isZoomed = scale > 1.01;
    const resetView = () => transformRef.current?.centerView(1, 200);

    // Breathing room around the chart so the centered/reset view sits smaller
    // and central within the (full-bleed) visualization panel.
    const VIS_PADDING = 56;
    const fitHeight =
        stageHeight > 0
            ? `${stageHeight - VIS_PADDING * 2}px`
            : "calc(100vh - 260px)";
    const hasMethod = conditionId !== "none";

    const dockItem = {
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 12px",
        borderRadius: "var(--mantine-radius-md)",
        cursor: "pointer",
        fontSize: 14,
        whiteSpace: "nowrap",
        flexShrink: 0,
    } as const;

    return (
        <Box
            style={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <Group
                justify="space-between"
                align="center"
                wrap="nowrap"
                px="md"
                py={6}
                gap="md"
                style={{
                    flexShrink: 0,
                    borderBottom: "0.5px solid var(--mantine-color-gray-3)",
                }}
            >
                <Group gap="xs" align="center" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                    <Image
                        src={`${import.meta.env.BASE_URL}favicon.ico`}
                        alt="Logo"
                        w={26}
                        h={26}
                        style={{ flexShrink: 0 }}
                    />
                    <Box style={{ minWidth: 0 }}>
                        <Text size="sm" truncate>
                            <Text span fw={700}>
                                Improving Low-Vision Chart Accessibility via
                                On-Cursor Visual Context
                            </Text>{" "}
                            <Text span fs="italic" c="dimmed">
                                Interactive Demo
                            </Text>
                        </Text>
                    </Box>
                </Group>
                <Group
                    gap="lg"
                    align="center"
                    wrap="nowrap"
                    style={{ flexShrink: 0 }}
                >
                    <UnstyledButton
                        onClick={() => setAboutOpen(true)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 13,
                            color: "var(--mantine-color-text)",
                        }}
                    >
                        About
                    </UnstyledButton>
                    <Anchor
                        href={PROJECT_URL}
                        target="_blank"
                        rel="noreferrer"
                        size="sm"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                        }}
                    >
                        <IconExternalLink size={15} />
                        Project Page
                    </Anchor>
                    <Tooltip
                        label="Cleaned-up public repo coming soon"
                        withArrow
                    >
                        <Group
                            gap={4}
                            align="center"
                            style={{
                                fontSize: 13,
                                color: "var(--mantine-color-dimmed)",
                                cursor: "not-allowed",
                            }}
                        >
                            <IconBrandGithub size={15} />
                            Code on GitHub
                        </Group>
                    </Tooltip>
                    <Anchor href={AUTHOR_URL} target="_blank" rel="noreferrer">
                        <Avatar
                            src={AUTHOR_IMG}
                            size={28}
                            radius="xl"
                            alt="Yotam Sechayk"
                        />
                    </Anchor>
                </Group>
            </Group>

            {/* Stage */}
            <Box
                ref={stageRef}
                style={{
                    position: "relative",
                    flex: 1,
                    minHeight: 0,
                    background: "var(--mantine-color-gray-0)",
                    overflow: "hidden",
                }}
            >
                <TransformWrapper
                    ref={transformRef}
                    minScale={1}
                    maxScale={maxScale}
                    initialScale={1}
                    centerOnInit
                    limitToBounds={false}
                    wheel={{ step: 0.2 }}
                    doubleClick={{ disabled: true }}
                    panning={{ velocityDisabled: true }}
                    onTransformed={(_, state) => setScale(state.scale)}
                >
                    <TransformComponent
                        wrapperStyle={{
                            width: "100%",
                            height: "100%",
                            cursor: "default",
                        }}
                    >
                        <Paper
                            shadow="sm"
                            withBorder
                            style={{
                                maxWidth: `calc(100% - ${VIS_PADDING * 2}px)`,
                                margin: "0 auto",
                                maxHeight: "100%",
                                lineHeight: 0,
                            }}
                        >
                            <VisualizationPanel
                                key={activeViz.id}
                                vizData={activeViz}
                                allowOverlay={hasMethod}
                                forceOverlay={hasMethod && settingsOpen}
                                pinOnClick
                                onPinnedChange={setPinned}
                                clearPinToken={clearPinToken}
                                onLoaded={() =>
                                    transformRef.current?.centerView(1, 0)
                                }
                                fitHeight={fitHeight}
                                scale={scale}
                            />
                        </Paper>
                    </TransformComponent>
                </TransformWrapper>

                {/* Pin status / coach mark */}
                {hasMethod && (
                    <Group
                        gap={6}
                        align="center"
                        style={{
                            position: "absolute",
                            top: 12,
                            left: 16,
                            background: pinned
                                ? "var(--mantine-color-orange-0)"
                                : "var(--mantine-color-body)",
                            border: `0.5px solid ${
                                pinned
                                    ? "var(--mantine-color-orange-4)"
                                    : "var(--mantine-color-gray-3)"
                            }`,
                            borderRadius: "var(--mantine-radius-md)",
                            padding: "3px 4px 3px 8px",
                        }}
                    >
                        {pinned ? (
                            <>
                                <IconMapPin
                                    size={14}
                                    color="var(--mantine-color-orange-7)"
                                />
                                <Text size="xs" c="orange.8">
                                    Focus pinned · click to move
                                </Text>
                                <UnstyledButton
                                    aria-label="Clear pinned focus point"
                                    onClick={() =>
                                        setClearPinToken((t) => t + 1)
                                    }
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                        padding: "1px 6px",
                                        borderRadius:
                                            "var(--mantine-radius-sm)",
                                        fontSize: 12,
                                        color: "var(--mantine-color-orange-8)",
                                        background:
                                            "var(--mantine-color-orange-1)",
                                    }}
                                >
                                    <IconX size={12} />
                                    Clear
                                </UnstyledButton>
                            </>
                        ) : (
                            <>
                                <IconPointer size={13} />
                                <Text size="xs" c="dimmed">
                                    Click the chart to set the focus point
                                </Text>
                            </>
                        )}
                    </Group>
                )}

                {/* Floating dock */}
                <Paper
                    shadow="md"
                    withBorder
                    style={{
                        position: "absolute",
                        bottom: 16,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "nowrap",
                        gap: 8,
                        padding: "6px 8px",
                        borderRadius: "var(--mantine-radius-xl)",
                        maxWidth: "calc(100vw - 24px)",
                        overflowX: "auto",
                    }}
                >
                    {/* Examples tray */}
                    <Popover
                        opened={examplesOpen}
                        onChange={setExamplesOpen}
                        position="top-start"
                        offset={12}
                        withArrow
                        shadow="md"
                    >
                        <Popover.Target>
                            <UnstyledButton
                                onClick={() => {
                                    setExamplesOpen((o) => !o);
                                    setSettingsOpen(false);
                                }}
                                style={{
                                    ...dockItem,
                                    background: examplesOpen
                                        ? "var(--mantine-color-gray-1)"
                                        : "transparent",
                                }}
                            >
                                <IconLibrary size={16} />
                                Chart Library
                                <IconChevronUp size={14} />
                            </UnstyledButton>
                        </Popover.Target>
                        <Popover.Dropdown p="xs">
                            <Text size="xs" fw={500} c="dimmed" mb={6} px={4}>
                                Chart Library
                            </Text>

                            {/* Upload — first option */}
                            <UnstyledButton
                                onClick={() => {
                                    setExamplesOpen(false);
                                    setUploadOpen(true);
                                }}
                                aria-label="Upload your own chart"
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                    width: "100%",
                                    padding: 6,
                                    marginBottom: 6,
                                    borderRadius: 8,
                                    border: `1px solid ${
                                        uploadedViz
                                            ? "var(--mantine-color-blue-4)"
                                            : "var(--mantine-color-gray-3)"
                                    }`,
                                    background: uploadedViz
                                        ? "var(--mantine-color-blue-0)"
                                        : "transparent",
                                }}
                            >
                                <Box
                                    style={{
                                        width: 72,
                                        height: 44,
                                        flexShrink: 0,
                                        borderRadius: 4,
                                        border: "1px dashed var(--mantine-color-gray-4)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "var(--mantine-color-gray-6)",
                                    }}
                                >
                                    <IconUpload size={20} />
                                </Box>
                                <div style={{ minWidth: 0 }}>
                                    <Text size="sm" fw={600} lineClamp={1}>
                                        Upload your own…
                                    </Text>
                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                        Drag, paste, or pick an image
                                    </Text>
                                </div>
                            </UnstyledButton>

                            <Divider mb={6} />

                            <ScrollArea
                                h={216}
                                w={320}
                                type="scroll"
                                scrollbarSize={8}
                                offsetScrollbars
                            >
                                <Stack gap={4} pr={6}>
                                    {DEMO_CHART_INDEX.map((c) => {
                                        const selected =
                                            c.vizId === activeViz.id;
                                        return (
                                            <UnstyledButton
                                                key={c.vizId}
                                                onClick={() => {
                                                    setUploadedViz(null);
                                                    updateParam("viz", c.vizId);
                                                    setExamplesOpen(false);
                                                }}
                                                aria-label={`${c.questionId} ${c.label}`}
                                                aria-pressed={selected}
                                                style={{
                                                    display: "flex",
                                                    gap: 10,
                                                    alignItems: "center",
                                                    padding: 6,
                                                    borderRadius: 8,
                                                    border: `1px solid ${
                                                        selected
                                                            ? "var(--mantine-color-blue-4)"
                                                            : "transparent"
                                                    }`,
                                                    background: selected
                                                        ? "var(--mantine-color-blue-0)"
                                                        : "transparent",
                                                }}
                                            >
                                                <Image
                                                    src={
                                                        DEMO_VIZ_BY_ID[c.vizId]
                                                            ?.pngUrl
                                                    }
                                                    alt=""
                                                    w={72}
                                                    h={44}
                                                    fit="contain"
                                                    style={{
                                                        flexShrink: 0,
                                                        background: "white",
                                                        borderRadius: 4,
                                                        border: "0.5px solid var(--mantine-color-gray-3)",
                                                    }}
                                                />
                                                <div style={{ minWidth: 0 }}>
                                                    <Text
                                                        size="sm"
                                                        fw={selected ? 600 : 500}
                                                        lineClamp={1}
                                                    >
                                                        {chartTitle(
                                                            c.vizId,
                                                            c.label
                                                        )}
                                                    </Text>
                                                    <Text
                                                        size="xs"
                                                        c="dimmed"
                                                        lineClamp={1}
                                                    >
                                                        {c.label}
                                                        {CHART_DESC[c.label]
                                                            ? ` · ${CHART_DESC[c.label]}`
                                                            : ""}
                                                    </Text>
                                                </div>
                                            </UnstyledButton>
                                        );
                                    })}
                                </Stack>
                            </ScrollArea>
                        </Popover.Dropdown>
                    </Popover>

                    <Box
                        style={{
                            width: 1,
                            height: 26,
                            background: "var(--mantine-color-gray-3)",
                        }}
                    />

                    {/* Method switcher */}
                    <SegmentedControl
                        style={{ flexShrink: 0 }}
                        value={conditionId}
                        onChange={(v) => updateParam("conditionId", v)}
                        data={(
                            ["none", "minimap", "overview"] as ConditionId[]
                        ).map((id) => ({
                            value: id,
                            label: (
                                <Group gap={5} align="center" wrap="nowrap">
                                    {METHOD_INFO[id].icon}
                                    <span>{METHOD_INFO[id].label}</span>
                                </Group>
                            ),
                        }))}
                    />

                    <Box
                        style={{
                            width: 1,
                            height: 26,
                            background: "var(--mantine-color-gray-3)",
                        }}
                    />

                    {/* Settings popover */}
                    <Popover
                        opened={settingsOpen}
                        onChange={setSettingsOpen}
                        position="top-start"
                        offset={12}
                        withArrow
                        shadow="md"
                        trapFocus={false}
                        closeOnClickOutside={false}
                    >
                        <Popover.Target>
                            <UnstyledButton
                                onClick={() => {
                                    setSettingsOpen((o) => !o);
                                    setExamplesOpen(false);
                                }}
                                style={{
                                    ...dockItem,
                                    background: settingsOpen
                                        ? "var(--mantine-color-gray-1)"
                                        : "transparent",
                                }}
                            >
                                <IconAdjustmentsHorizontal size={16} />
                                Settings
                            </UnstyledButton>
                        </Popover.Target>
                        <Popover.Dropdown p={0}>
                            <ScrollArea
                                h="min(60vh, 460px)"
                                w={360}
                                type="scroll"
                            >
                                <SettingsPanel conditionId={conditionId} />
                            </ScrollArea>
                        </Popover.Dropdown>
                    </Popover>

                    <Box
                        style={{
                            width: 1,
                            height: 26,
                            background: "var(--mantine-color-gray-3)",
                        }}
                    />

                    {/* Zoom / magnification controls */}
                    <Group gap={4} align="center" wrap="nowrap" style={{ flexShrink: 0 }}>
                        <Tooltip label="Zoom out" withArrow>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                disabled={!isZoomed}
                                onClick={() => transformRef.current?.zoomOut()}
                                aria-label="Zoom out"
                            >
                                <IconZoomOut size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <UnstyledButton
                            onClick={resetView}
                            aria-label="Reset zoom"
                            style={{
                                minWidth: 48,
                                textAlign: "center",
                                fontSize: 13,
                                fontVariantNumeric: "tabular-nums",
                                color: "var(--mantine-color-text)",
                            }}
                        >
                            {Math.round(scale * 100)}%
                        </UnstyledButton>
                        <Tooltip label="Zoom in" withArrow>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                disabled={scale >= maxScale}
                                onClick={() => transformRef.current?.zoomIn()}
                                aria-label="Zoom in"
                            >
                                <IconZoomIn size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Reset zoom" withArrow>
                            <ActionIcon
                                variant="subtle"
                                color="gray"
                                onClick={resetView}
                                aria-label="Reset zoom"
                            >
                                <IconZoomReset size={18} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Paper>
            </Box>

            {/* Footer credit */}
            <Group
                justify="center"
                align="center"
                gap={8}
                px="md"
                py={6}
                style={{
                    flexShrink: 0,
                    background: "#2E073F",
                }}
            >
                <Text size="xs" c="#d8bce6">
                    Created with love and care by
                </Text>
                <Anchor
                    href={AUTHOR_URL}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <Avatar
                        src={AUTHOR_IMG}
                        size={20}
                        radius="xl"
                        alt="Yotam Sechayk"
                    />
                    <Text span size="xs" fw={500} c="#ffffff">
                        Yotam Sechayk
                    </Text>
                </Anchor>
                <Text size="xs" c="#d8bce6">
                    — reach out with any questions.
                </Text>
            </Group>

            {/* Upload modal */}
            <UploadModal
                opened={uploadOpen}
                onClose={() => setUploadOpen(false)}
                onLoaded={(viz) => {
                    setUploadedViz(viz);
                    setUploadOpen(false);
                }}
            />

            {/* About modal */}
            <Modal
                opened={aboutOpen}
                onClose={() => setAboutOpen(false)}
                title="About this demo"
                size="lg"
                centered
            >
                <Stack gap="md">
                    <Text size="sm">
                        This demo accompanies our work on making data
                        visualizations easier to read for low-vision users who
                        rely on screen magnification. When you zoom into a chart
                        you normally lose sight of axes, labels, and the legend.
                        These techniques instead bring that context to where you
                        are looking — around the cursor.
                    </Text>

                    <div>
                        <Title order={5} mb={4}>
                            Interaction methods
                        </Title>
                        <List size="sm" spacing={4}>
                            <List.Item>
                                <Text span fw={500}>
                                    Mini-map
                                </Text>{" "}
                                — a scaled-down copy of the whole chart with an
                                indicator marking your cursor's position.
                            </List.Item>
                            <List.Item>
                                <Text span fw={500}>
                                    Dynamic Context
                                </Text>{" "}
                                — the nearest axis labels and the legend follow
                                your cursor, with a crosshair for alignment.
                            </List.Item>
                        </List>
                    </div>

                    <div>
                        <Title order={5} mb={4}>
                            How to use
                        </Title>
                        <List size="sm" spacing={4}>
                            <List.Item>
                                Pick an example chart from{" "}
                                <Text span fw={500}>
                                    Examples
                                </Text>{" "}
                                in the bottom dock.
                            </List.Item>
                            <List.Item>
                                Choose an interaction method (None, Mini-map, or
                                Dynamic Context).
                            </List.Item>
                            <List.Item>
                                Move your cursor over the chart — the overlay
                                follows it.
                            </List.Item>
                            <List.Item>
                                Use your{" "}
                                <Text span fw={500}>
                                    screen magnifier
                                </Text>{" "}
                                and hover the chart,{" "}
                                <Text span fs="italic">
                                    or alternatively...
                                </Text>
                            </List.Item>
                            <List.Item>
                                <Text span fw={500}>
                                    Scroll
                                </Text>{" "}
                                to magnify,{" "}
                                <Text span fw={500}>
                                    drag
                                </Text>{" "}
                                to pan, and use the zoom controls to reset the
                                view.
                            </List.Item>
                        </List>

                        <Title order={5} mt="md" mb={4}>
                            How to customize
                        </Title>
                        <List size="sm" spacing={4}>
                            <List.Item>
                                Open the{" "}
                                <Text span fw={500}>
                                    Settings
                                </Text>{" "}
                                in the bottom dock.
                            </List.Item>
                            <List.Item>
                                <Text span fw={500}>
                                    Click
                                </Text>{" "}
                                the chart to pin a focus point, then fine-tune
                                the overlay while it stays pinned.
                            </List.Item>
                        </List>
                    </div>

                    <Divider />

                    <Group justify="space-between" align="center">
                        <Anchor
                            href={AUTHOR_URL}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <Avatar
                                src={AUTHOR_IMG}
                                size={32}
                                radius="xl"
                                alt="Yotam Sechayk"
                            />
                            <Text span size="sm">
                                Created with love and care by{" "}
                                <Text span fw={500}>
                                    Yotam Sechayk
                                </Text>
                            </Text>
                        </Anchor>
                        <Anchor
                            href={PROJECT_URL}
                            target="_blank"
                            rel="noreferrer"
                            size="sm"
                        >
                            Project page →
                        </Anchor>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
};

export default DemoPage;
