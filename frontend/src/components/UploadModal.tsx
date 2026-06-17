import { Box, Button, Group, Image, Modal, Stack, Text } from "@mantine/core";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import {
    analyzeChart,
    isAnalyzeEnabled,
    loadChartImage,
} from "../analysis/chart-analyzer";
import type { VisualizationData } from "../types/visualization-types";

type Props = {
    opened: boolean;
    onClose: () => void;
    onLoaded: (viz: VisualizationData) => void;
};

const UploadModal = ({ opened, onClose, onLoaded }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setFile(null);
        setPreview((p) => {
            if (p) URL.revokeObjectURL(p);
            return null;
        });
        setDragging(false);
        setLoading(false);
        setError(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const selectFile = (f?: File | null) => {
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            setError("Please choose an image file.");
            return;
        }
        setError(null);
        setFile(f);
        setPreview((p) => {
            if (p) URL.revokeObjectURL(p);
            return URL.createObjectURL(f);
        });
    };

    // Paste-an-image support while the modal is open.
    useEffect(() => {
        if (!opened) return;
        const onPaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const it of Array.from(items)) {
                if (it.type.startsWith("image/")) {
                    selectFile(it.getAsFile());
                    break;
                }
            }
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, [opened]);

    const handleUse = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            const viz = isAnalyzeEnabled
                ? await analyzeChart(file)
                : await loadChartImage(file);
            onLoaded(viz);
            handleClose();
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Could not load the image."
            );
            setLoading(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Upload a chart"
            size="lg"
            centered
        >
            <Stack gap="md">
                <Box
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        selectFile(e.dataTransfer.files?.[0]);
                    }}
                    style={{
                        border: `2px dashed ${
                            dragging
                                ? "var(--mantine-color-blue-5)"
                                : "var(--mantine-color-gray-4)"
                        }`,
                        background: dragging
                            ? "var(--mantine-color-blue-0)"
                            : "var(--mantine-color-gray-0)",
                        borderRadius: "var(--mantine-radius-md)",
                        padding: "28px 16px",
                        textAlign: "center",
                        cursor: "pointer",
                    }}
                >
                    {preview ? (
                        <Image
                            src={preview}
                            alt="Selected chart preview"
                            mah={260}
                            maw="100%"
                            fit="contain"
                            style={{ width: "auto", margin: "0 auto" }}
                        />
                    ) : (
                        <Stack align="center" gap={6}>
                            <IconPhoto
                                size={36}
                                color="var(--mantine-color-gray-5)"
                            />
                            <Text fw={500}>
                                Drag &amp; drop, paste, or click to choose an
                                image
                            </Text>
                            <Text size="xs" c="dimmed">
                                PNG, JPG, etc. The image stays in your browser.
                            </Text>
                        </Stack>
                    )}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => selectFile(e.currentTarget.files?.[0])}
                    />
                </Box>

                {!isAnalyzeEnabled && (
                    <Text size="xs" c="dimmed">
                        Mini-map and magnification work on any image. Detecting
                        axes and the legend for{" "}
                        <Text span fw={500}>
                            Dynamic Context
                        </Text>{" "}
                        needs an analyzer endpoint, which isn't configured here.
                    </Text>
                )}

                {error && (
                    <Text size="sm" c="red">
                        {error}
                    </Text>
                )}

                <Group justify="flex-end" gap="sm">
                    {file && !loading && (
                        <Button
                            variant="subtle"
                            color="gray"
                            leftSection={<IconX size={16} />}
                            onClick={reset}
                        >
                            Clear
                        </Button>
                    )}
                    <Button
                        leftSection={<IconUpload size={16} />}
                        loading={loading}
                        disabled={!file}
                        onClick={handleUse}
                    >
                        {loading
                            ? isAnalyzeEnabled
                                ? "Analyzing…"
                                : "Loading…"
                            : "Use chart"}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default UploadModal;
