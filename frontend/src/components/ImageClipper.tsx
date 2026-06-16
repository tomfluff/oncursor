import { Box, Image } from "@mantine/core";
import { useEffect, useState } from "react";

interface ImageClipperProps {
    /** Image source URL */
    src: string;
    /** Relative x1 position (0-1) - left edge of bounding box */
    x1: number;
    /** Relative y1 position (0-1) - top edge of bounding box */
    y1: number;
    /** Relative x2 position (0-1) - right edge of bounding box */
    x2: number;
    /** Relative y2 position (0-1) - bottom edge of bounding box */
    y2: number;
    /** Scale factor for the final output size (default: 1) */
    scale?: number;
}

const ImageClipped = ({
    src,
    x1,
    y1,
    x2,
    y2,
    scale = 1,
}: ImageClipperProps) => {
    const [imageDimensions, setImageDimensions] = useState<{
        width: number;
        height: number;
    } | null>(null);

    // Validate inputs
    const isValidRange = (value: number) => value >= 0 && value <= 1;
    const isValidBoundingBox = x1 < x2 && y1 < y2;

    if (
        !isValidRange(x1) ||
        !isValidRange(y1) ||
        !isValidRange(x2) ||
        !isValidRange(y2)
    ) {
        console.warn(
            "BoundingBoxImageCropper: x1, y1, x2, y2 must be between 0 and 1"
        );
    }

    if (!isValidBoundingBox) {
        console.warn(
            "BoundingBoxImageCropper: Invalid bounding box - x1 must be < x2 and y1 must be < y2"
        );
    }

    // Load image to get dimensions
    useEffect(() => {
        const img = new window.Image();
        img.onload = () => {
            setImageDimensions({
                width: img.naturalWidth,
                height: img.naturalHeight,
            });
        };
        img.src = src;
    }, [src]);

    if (!imageDimensions) {
        return null;
    }

    // Calculate cropped area dimensions in pixels
    const cropWidth = (x2 - x1) * imageDimensions.width;
    const cropHeight = (y2 - y1) * imageDimensions.height;

    // Apply scale to the cropped dimensions
    const scaledWidth = cropWidth * scale;
    const scaledHeight = cropHeight * scale;

    return (
        <Box
            style={{
                display: "inline-block",
                overflow: "hidden",
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
            }}
        >
            <Image
                src={src}
                style={{
                    display: "block",
                    width: `${imageDimensions.width * scale}px`,
                    height: `${imageDimensions.height * scale}px`,
                    marginLeft: `-${x1 * imageDimensions.width * scale}px`,
                    marginTop: `-${y1 * imageDimensions.height * scale}px`,
                }}
                draggable={false}
            />
        </Box>
    );
};

export default ImageClipped;
