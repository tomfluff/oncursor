import { Box, Text } from "@mantine/core";
import { useCallback, useMemo } from "react";
import type {
    IAnnotation,
    VisualizationData,
} from "../types/visualization-types";
import ImageClipped from "./ImageClipper";

type Props = {
    vizData: VisualizationData;
    axisData: IAnnotation;
    relX: number;
    relY: number;
    spacing: number;
    orientation: "horizontal" | "vertical";
    axisItemsData: IAnnotation[];
    vizScale?: number;
    wrapperRatioX?: number;
    wrapperRatioY?: number;
    isVisible?: boolean;
};

const AxisSnippet = (props: Props) => {
    const {
        vizData,
        axisData,
        axisItemsData,
        relX,
        relY,
        spacing,
        orientation,
        vizScale,
        wrapperRatioX = 1,
        wrapperRatioY = 1,
        isVisible = true,
    } = props;

    const boundingBox = useMemo(() => {
        let result = {
            x1: 0,
            y1: 0,
            x2: 0,
            y2: 0,
        };
        if (orientation === "horizontal") {
            const axisMinY = axisData.bbox.y1;
            const axisMaxY = axisData.bbox.y2;
            const itemsMinY =
                axisItemsData.length > 0
                    ? Math.min(...axisItemsData.map((item) => item.bbox.y1))
                    : axisMinY;
            const itemsMaxY =
                axisItemsData.length > 0
                    ? Math.max(...axisItemsData.map((item) => item.bbox.y2))
                    : axisMaxY;

            result = {
                x1: Math.max(relX - spacing / 2, 0),
                y1: Math.max(itemsMinY, 0),
                x2: Math.min(relX + spacing / 2, 1),
                y2: Math.min(itemsMaxY, 1),
            };
        } else if (orientation === "vertical") {
            const axisMinX = axisData.bbox.x1;
            const axisMaxX = axisData.bbox.x2;
            const itemsMinX =
                axisItemsData.length > 0
                    ? Math.min(...axisItemsData.map((item) => item.bbox.x1))
                    : axisMinX;
            const itemsMaxX =
                axisItemsData.length > 0
                    ? Math.max(...axisItemsData.map((item) => item.bbox.x2))
                    : axisMaxX;

            result = {
                x1: Math.max(itemsMinX, 0),
                y1: Math.max(relY - spacing / 2, 0),
                x2: Math.min(itemsMaxX, 1),
                y2: Math.min(relY + spacing / 2, 1),
            };
        }
        return result;
    }, [axisData, axisItemsData, orientation, relX, relY, spacing]);

    const placement = useMemo(() => {
        if (orientation === "horizontal") {
            return {
                left: `calc(50% + ${
                    (spacing - (boundingBox.x2 - boundingBox.x1)) *
                    wrapperRatioX *
                    0.5 *
                    100 *
                    (relX < 0.5 ? 1 : -1)
                }%)`,
                bottom: 0,
                transform: "translateX(-50%)",
            };
        } else if (orientation === "vertical") {
            return {
                top: `calc(50% + ${
                    (spacing - (boundingBox.y2 - boundingBox.y1)) *
                    wrapperRatioY *
                    0.5 *
                    100 *
                    (relY < 0.5 ? 1 : -1)
                }%)`,
                left: 0,
                transform: "translateY(-50%)",
            };
        }
        return {};
    }, [
        boundingBox,
        orientation,
        relX,
        relY,
        spacing,
        wrapperRatioX,
        wrapperRatioY,
    ]);

    const getLabelPlacement = useCallback(() => {
        if (orientation === "horizontal") {
            return {
                bottom: 0,
                right: 0,
            };
        } else if (orientation === "vertical") {
            return {
                top: 0,
                left: 0,
            };
        } else {
            return {};
        }
    }, [orientation]);

    return (
        <>
            {axisData.text && (
                <Text
                    size="xs"
                    maw="30%"
                    style={{
                        position: "absolute",
                        ...getLabelPlacement(),
                        backgroundColor: "white",
                        border: "1px solid black",
                        padding: "2px 4px",
                        zIndex: 1000,
                    }}
                >
                    {axisData.text}
                </Text>
            )}
            <Box
                lh={0}
                style={{
                    position: "absolute",
                    boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
                    opacity: isVisible ? 1 : 0,
                    transition: "opacity 0.3s ease",
                    ...placement,
                }}
            >
                <ImageClipped
                    src={vizData.pngUrl || ""}
                    x1={boundingBox.x1}
                    y1={boundingBox.y1}
                    x2={boundingBox.x2}
                    y2={boundingBox.y2}
                    scale={vizScale || 1}
                    padding={8}
                />
            </Box>
        </>
    );
};

export default AxisSnippet;
