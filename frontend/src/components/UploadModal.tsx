import { Box, Button, Group, Modal, Stack, Text } from "@mantine/core";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { type ChartBoxes, loadChartImage } from "../data/uploaded-chart";
import type { VisualizationData } from "../types/visualization-types";
import ChartAnnotator from "./ChartAnnotator";

type Props = {
    opened: boolean;
    onClose: () => void;
    onLoaded: (viz: VisualizationData) => void;
};

const UploadModal = ({ opened, onClose, onLoaded }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [boxes, setBoxes] = useState<ChartBoxes>({});
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setFile(null);
        setPreview((p) => {
            if (p) URL.revokeObjectURL(p);
            return null;
        });
        setBoxes({});
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
        setBoxes({});
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
            onLoaded(await loadChartImage(file, boxes));
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
            title={file ? "Mark the chart's axes and legend" : "Upload a chart"}
            size="xl"
            centered
            // A stray click must not throw away the boxes drawn so far.
            closeOnClickOutside={!file}
        >
            <Stack gap="md">
                {preview ? (
                    <ChartAnnotator
                        key={preview}
                        src={preview}
                        boxes={boxes}
                        onChange={setBoxes}
                        disabled={loading}
                    />
                ) : (
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
                                    ? "var(--oc-selected-border)"
                                    : "var(--oc-divider-strong)"
                            }`,
                            background: dragging
                                ? "var(--oc-selected)"
                                : "var(--oc-stage)",
                            borderRadius: "var(--mantine-radius-md)",
                            padding: "28px 16px",
                            textAlign: "center",
                            cursor: "pointer",
                        }}
                    >
                        <Stack align="center" gap={6}>
                            <IconPhoto
                                size={36}
                                color="var(--mantine-color-dimmed)"
                            />
                            <Text fw={500}>
                                Drag &amp; drop, paste, or click to choose an
                                image
                            </Text>
                            <Text size="xs" c="dimmed">
                                PNG, JPG, etc. The image stays in your browser.
                            </Text>
                        </Stack>
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) =>
                                selectFile(e.currentTarget.files?.[0])
                            }
                        />
                    </Box>
                )}

                {file && (
                    <Text size="xs" c="dimmed">
                        Skip anything the chart doesn't have.{" "}
                        <Text span fw={500}>
                            Dynamic Context
                        </Text>{" "}
                        shows the parts you mark. Mini-map and magnification
                        work without any boxes.
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
                            Choose another image
                        </Button>
                    )}
                    <Button
                        leftSection={<IconUpload size={16} />}
                        loading={loading}
                        disabled={!file}
                        onClick={handleUse}
                    >
                        {loading ? "Loading…" : "Use chart"}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default UploadModal;
