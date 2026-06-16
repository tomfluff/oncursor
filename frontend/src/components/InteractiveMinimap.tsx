import { Box, Image } from "@mantine/core";
import { useMemo } from "react";
import useSessionStore from "../stores/session-store";
import type { VisualizationData } from "../types/visualization-types";

type Props = {
    vizData: VisualizationData;
    containerRef?: React.RefObject<HTMLDivElement>;
    cursorX: number;
    cursorY: number;
};

const InteractiveMinimap = (props: Props) => {
    const { vizData, containerRef, cursorX, cursorY } = props;
    const minimapScale = useSessionStore((state) => state.minimapScale.value);
    const minimapIndicatorSize = useSessionStore(
        (state) => state.minimapIndicatorScale.value
    );
    const minimapIndicatorColor = useSessionStore(
        (state) => state.minimapIndicatorColor.value
    );
    const minimapLocation = useSessionStore(
        (state) => state.minimapLocation.value
    );

    const relX = containerRef
        ? cursorX / containerRef.current.offsetWidth
        : 0.5; // Default to center if no container
    const relY = containerRef
        ? cursorY / containerRef.current.offsetHeight
        : 0.5; // Default to center if no container

    const locationValues = useMemo(() => {
        if (minimapLocation === "top left") {
            return { top: 0, left: 0 };
        }
        if (minimapLocation === "top right") {
            return { top: 0, right: 0 };
        }
        if (minimapLocation === "bottom left") {
            return { bottom: 0, left: 0 };
        }
        if (minimapLocation === "bottom right") {
            return { bottom: 0, right: 0 };
        }
        return { top: 0, left: 0 }; // Default fallback
    }, [minimapLocation]);

    return (
        <Box
            style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
            }}
        >
            <Box
                style={{
                    position: "absolute",
                    width: `${100 * minimapScale}%`,
                    height: "auto",
                    ...locationValues,
                }}
            >
                <Image
                    src={vizData.pngUrl}
                    alt="Minimap Image"
                    style={{
                        backgroundColor: "white",
                        border: "1px solid black",
                        padding: "3px",
                        borderRadius: "3px",
                    }}
                />

                {/* Position Indicator */}
                <Box
                    style={{
                        position: "absolute",
                        width: `${100 * minimapIndicatorSize}%`,
                        aspectRatio: "1",
                        backgroundColor: minimapIndicatorColor,
                        border: "2px solid white",
                        borderRadius: "50%",
                        transform: "translate(-50%, -50%)",
                        left: `${Math.max(0, Math.min(1, relX)) * 100}%`,
                        top: `${Math.max(0, Math.min(1, relY)) * 100}%`,
                        pointerEvents: "none",
                        boxShadow: "0 0 4px rgba(0, 0, 0, 0.5)",
                        zIndex: 10,
                    }}
                />
            </Box>
        </Box>
    );
};

export default InteractiveMinimap;
