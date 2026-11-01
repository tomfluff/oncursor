import type {
    Bbox,
    IAnnotation,
    VisualizationData,
} from "../types/visualization-types";

/**
 * Turns an uploaded image plus the boxes the user drew on it into
 * {@link VisualizationData}, the same shape as the bundled example charts.
 * Everything happens in the browser: the image is kept as a data URL and
 * nothing is sent anywhere.
 */

export type ChartBoxKind = "horizontalAxis" | "verticalAxis" | "legend";

/** The boxes drawn on a chart, normalized 0..1. Every kind is optional. */
export type ChartBoxes = Partial<Record<ChartBoxKind, Bbox>>;

interface ReadImageResult {
    dataUrl: string;
    width: number;
    height: number;
}

/** Read a File into a data URL plus its intrinsic pixel size. */
function readImage(file: File): Promise<ReadImageResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () =>
            reject(new Error("Could not read the image file."));
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const img = new Image();
            img.onload = () =>
                resolve({
                    dataUrl,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            img.onerror = () =>
                reject(new Error("Could not decode the image."));
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Convert drawn boxes to overlay annotations. Drawn axes have no tick-label
 * items to infer a direction from, so each one states its orientation.
 */
function boxesToAnnotations(boxes: ChartBoxes): IAnnotation[] {
    const annotations: IAnnotation[] = [];
    if (boxes.horizontalAxis) {
        annotations.push({
            id: "axis-x",
            type: "axis",
            orientation: "horizontal",
            bbox: boxes.horizontalAxis,
        });
    }
    if (boxes.verticalAxis) {
        annotations.push({
            id: "axis-y",
            type: "axis",
            orientation: "vertical",
            bbox: boxes.verticalAxis,
        });
    }
    if (boxes.legend) {
        annotations.push({ id: "legend", type: "legend", bbox: boxes.legend });
    }
    return annotations;
}

/**
 * Load an uploaded image as a chart. The mini-map, focus box, and
 * magnification work on any image; only Dynamic Context needs the boxes.
 */
export async function loadChartImage(
    file: File,
    boxes: ChartBoxes
): Promise<VisualizationData> {
    const { dataUrl, width, height } = await readImage(file);
    return {
        id: `upload-${Date.now()}`,
        name: file.name,
        pngUrl: dataUrl,
        width,
        height,
        annotations: boxesToAnnotations(boxes),
    };
}
