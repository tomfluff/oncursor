import { Box } from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import { useUrlVariables } from "../hooks/useUrlVariables";
import useSessionStore from "../stores/session-store";
import type { VisualizationData } from "../types/visualization-types";
import InteractiveMinimap from "./InteractiveMinimap";
import InteractiveOverview from "./InteractiveOverview";

type Props = {
    vizData: VisualizationData;
    containerRef: React.RefObject<HTMLDivElement>;
    cursorX: number;
    cursorY: number;
    isHovering?: boolean; // Optional prop to indicate if the overlay is being hovered
    isHideContent?: boolean; // Optional prop to control content visibility
};

const DynamicOverlay = (props: Props) => {
    const {
        cursorX,
        cursorY,
        vizData,
        containerRef,
        isHovering = false,
        isHideContent = false,
    } = props;
    const { conditionId } = useUrlVariables();

    const { width: viewportWidth, height: viewportHeight } = useViewportSize();

    // Get session settings
    const overlayWidth = useSessionStore((state) => state.overlayWidth.value);
    const overlayHeight = useSessionStore((state) => state.overlayHeight.value);
    const overlayBorderEnable = useSessionStore(
        (state) => state.overlayBorderEnabled.value
    );
    const overlayBorderColor = useSessionStore(
        (state) => state.overlayBorderColor.value
    );
    const overlayBorderWidth = useSessionStore(
        (state) => state.overlayBorderWidth.value
    );
    const overlayDimmingEnabled = useSessionStore(
        (state) => state.overlayDimmingEnabled.value
    );

    if (conditionId !== "minimap" && conditionId !== "overview") {
        return null; // Only render if conditionId is "minimap" or "overview"
    }

    return (
        <Box
            lh={0}
            p={0}
            m={0}
            style={{
                position: "absolute",
                top: `${cursorY}px`,
                left: `${cursorX}px`,
                width: Math.min(viewportWidth, viewportHeight) * overlayWidth,
                height: Math.min(viewportWidth, viewportHeight) * overlayHeight,
                border: overlayBorderEnable
                    ? `${overlayBorderWidth}px solid ${overlayBorderColor}`
                    : "none",
                boxShadow:
                    isHovering && overlayDimmingEnabled
                        ? "0 0 0 9999px rgba(0, 0, 0, 0.5)"
                        : "none",
                transition: "box-shadow 0.3s ease",
                transformOrigin: "center",
                transform: `translate(-50%, -50%)`,
                pointerEvents: "none",
                zIndex: 100,
            }}
        >
            <Box
                style={{
                    opacity: isHideContent ? 0 : 1,
                    transition: "opacity 0.3s",
                }}
            >
                {conditionId === "minimap" && (
                    <InteractiveMinimap
                        vizData={vizData}
                        containerRef={containerRef}
                        cursorX={cursorX}
                        cursorY={cursorY}
                    />
                )}
                {conditionId === "overview" && (
                    <InteractiveOverview
                        vizData={vizData}
                        containerRef={containerRef}
                        cursorX={cursorX}
                        cursorY={cursorY}
                    />
                )}
            </Box>
        </Box>
    );
};

export default DynamicOverlay;
