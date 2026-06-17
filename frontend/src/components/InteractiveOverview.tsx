import { Box, Group } from "@mantine/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSessionStore from "../stores/session-store";
import {
    type IAnnotation,
    type VisualizationData,
} from "../types/visualization-types";
import AxisSnippet from "./AxisSnippet";
import LegendSnippet from "./LegendSnippet";

type Props = {
    vizData: VisualizationData;
    containerRef: React.RefObject<HTMLElement>;
    cursorX: number;
    cursorY: number;
};

const InteractiveOverview = (props: Props) => {
    const { vizData, containerRef, cursorX, cursorY } = props;
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Overview settings
    const overviewSpacing = useSessionStore(
        (state) => state.overviewSpacing.value
    );
    // Crosshair settings
    const overviewCrosshairEnabled = useSessionStore(
        (state) => state.overviewCrosshairEnabled.value
    );
    const overviewCrosshairRatio = useSessionStore(
        (state) => state.overviewCrosshairRatio.value
    );
    const overviewCrosshairColor = useSessionStore(
        (state) => state.overviewCrosshairColor.value
    );
    const overviewCrosshairOpacity = useSessionStore(
        (state) => state.overviewCrosshairOpacity.value
    );
    const overviewCrosshairWidth = useSessionStore(
        (state) => state.overviewCrosshairWidth.value
    );

    const { width: vizWidth } = vizData;

    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    useEffect(() => {
        const el = containerRef.current ?? wrapperRef.current;
        if (!el) return;
        const updateSize = () => {
            setContainerSize({
                width: el.offsetWidth,
                height: el.offsetHeight,
            });
        };
        updateSize();
        const ro = new ResizeObserver(updateSize);
        ro.observe(el);
        return () => {
            ro.disconnect();
        };
    }, [containerRef, wrapperRef]);

    const vizScale = useMemo(
        () => (vizWidth > 0 ? containerSize.width / vizWidth : 0),
        [containerSize.width, vizWidth]
    );
    const { relX, relY } = useMemo(() => {
        if (containerSize.width > 0 && containerSize.height > 0) {
            return {
                relX: cursorX / containerSize.width,
                relY: cursorY / containerSize.height,
            };
        }
        return { relX: 0, relY: 0 };
    }, [containerSize.height, containerSize.width, cursorX, cursorY]);

    const legends = useMemo(() => {
        return vizData.annotations?.filter(
            (annotation) => annotation.type === "legend"
        );
    }, [vizData.annotations]);

    const axes = useMemo(() => {
        return vizData.annotations?.filter(
            (annotation) => annotation.type === "axis"
        );
    }, [vizData.annotations]);

    const getAxisOrientation = useCallback(
        (axis: IAnnotation): "horizontal" | "vertical" => {
            if (!axis) return "horizontal";
            const axisItems = vizData.annotations?.filter(
                (item) => item.type === "axis-item" && item.parent === axis.id
            );
            if (!axisItems || axisItems.length === 0) return "horizontal";

            const xCoords = axisItems.map(
                (item) => item.bbox.x1 + (item.bbox.x2 - item.bbox.x1) / 2
            );
            const yCoords = axisItems.map(
                (item) => item.bbox.y1 + (item.bbox.y2 - item.bbox.y1) / 2
            );

            // Calculate variance
            const xMean = xCoords.reduce((a, b) => a + b, 0) / xCoords.length;
            const yMean = yCoords.reduce((a, b) => a + b, 0) / yCoords.length;
            const xVariance =
                xCoords.reduce((a, b) => a + Math.pow(b - xMean, 2), 0) /
                xCoords.length;
            const yVariance =
                yCoords.reduce((a, b) => a + Math.pow(b - yMean, 2), 0) /
                yCoords.length;
            return xVariance > yVariance ? "horizontal" : ("vertical" as const);
        },
        [vizData.annotations]
    );

    const getAxisSpatialInfo = useCallback(
        (axis: IAnnotation) => {
            if (!axis) return null;
            if (!wrapperRef.current) return null;
            const orientation = getAxisOrientation(axis);
            const distanceX = Math.abs(
                relX - (axis.bbox.x1 + axis.bbox.x2) / 2
            );
            const distanceY = Math.abs(
                relY - (axis.bbox.y1 + axis.bbox.y2) / 2
            );
            const wrapperWidth = wrapperRef.current.offsetWidth;
            const wrapperHeight = wrapperRef.current.offsetHeight;
            const isVisible =
                orientation === "horizontal"
                    ? distanceY >= wrapperHeight / containerSize.height / 2
                    : distanceX >= wrapperWidth / containerSize.width / 2;
            const wrapperRatioX = containerSize.width / wrapperWidth;
            const wrapperRatioY = containerSize.height / wrapperHeight;

            return {
                orientation,
                isVisible,
                wrapperRatioX,
                wrapperRatioY,
            };
        },
        [
            wrapperRef,
            containerSize.height,
            containerSize.width,
            getAxisOrientation,
            relX,
            relY,
        ]
    );

    return (
        <Box
            ref={wrapperRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
            }}
        >
            {/* Crosshair */}
            <Box
                className="overview-crosshair"
                style={{ position: "absolute", width: "100%", height: "100%" }}
                hidden={!overviewCrosshairEnabled}
            >
                <Box
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: `${overviewCrosshairRatio * 100}%`,
                        height: `${overviewCrosshairWidth}px`,
                        backgroundColor: overviewCrosshairColor,
                        opacity: overviewCrosshairOpacity,
                        transform: "translate(-50%, -50%)",
                    }}
                />
                <Box
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        width: `${overviewCrosshairWidth}px`,
                        height: `${overviewCrosshairRatio * 100}%`,
                        backgroundColor: overviewCrosshairColor,
                        opacity: overviewCrosshairOpacity,
                        transform: "translate(-50%, -50%)",
                    }}
                />
            </Box>
            {/* Legends */}
            <Group
                gap={0}
                justify="flex-end"
                style={{ position: "absolute", top: 0, right: 0 }}
            >
                {legends?.map((legend) => (
                    <LegendSnippet
                        key={legend.id}
                        legendData={legend}
                        vizData={vizData}
                        scale={vizScale}
                    />
                ))}
            </Group>
            {/* Axes */}
            {axes?.map((axis) => {
                const spatialInfo = getAxisSpatialInfo(axis);
                if (!spatialInfo) return null;
                return (
                    <AxisSnippet
                        key={axis.id}
                        vizData={vizData}
                        axisData={axis}
                        axisItemsData={
                            vizData.annotations?.filter(
                                (item) =>
                                    item.type === "axis-item" &&
                                    item.parent === axis.id
                            ) ?? []
                        }
                        relX={relX}
                        relY={relY}
                        spacing={overviewSpacing}
                        vizScale={vizScale}
                        orientation={spatialInfo.orientation}
                        wrapperRatioX={spatialInfo.wrapperRatioX}
                        wrapperRatioY={spatialInfo.wrapperRatioY}
                        isVisible={spatialInfo.isVisible}
                    />
                );
            })}
        </Box>
    );
};

export default InteractiveOverview;
