import { Box } from "@mantine/core";
import type {
    IAnnotation,
    VisualizationData,
} from "../types/visualization-types";
import ImageClipped from "./ImageClipper";

type Props = {
    legendData: IAnnotation;
    vizData: VisualizationData;
    scale?: number;
};

const LegendSnippet = (props: Props) => {
    const { legendData, vizData, scale } = props;

    return (
        <Box
            key={legendData.id}
            lh={0} // Prevents bottom spacing
            style={{
                boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
            }}
        >
            <ImageClipped
                src={vizData.pngUrl || ""}
                x1={legendData.bbox.x1}
                y1={legendData.bbox.y1}
                x2={legendData.bbox.x2}
                y2={legendData.bbox.y2}
                scale={scale || 1}
                padding={4}
            />
        </Box>
    );
};

export default LegendSnippet;
