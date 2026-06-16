import { Button, Tooltip } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { useRef, useState } from "react";
import {
    analyzeChart,
    isAnalyzeEnabled,
} from "../analysis/chart-analyzer";
import type { VisualizationData } from "../types/visualization-types";

type Props = {
    onAnalyzed: (viz: VisualizationData) => void;
};

/**
 * Dock control for the (optional) "upload & analyze your own chart" feature.
 * Renders nothing unless an analyzer endpoint is configured, so the static
 * build is unaffected.
 */
const UploadChartButton = ({ onAnalyzed }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isAnalyzeEnabled) return null;

    const handleFile = async (file?: File | null) => {
        if (!file) return;
        setError(null);
        setLoading(true);
        try {
            onAnalyzed(await analyzeChart(file));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Analysis failed.");
        } finally {
            setLoading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <Tooltip
            label={error ?? "Upload a chart image to analyze"}
            withArrow
            color={error ? "red" : undefined}
        >
            <Button
                variant="subtle"
                size="compact-sm"
                color={error ? "red" : "gray"}
                leftSection={<IconUpload size={16} />}
                loading={loading}
                onClick={() => inputRef.current?.click()}
            >
                Upload
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleFile(e.currentTarget.files?.[0])}
                />
            </Button>
        </Tooltip>
    );
};

export default UploadChartButton;
