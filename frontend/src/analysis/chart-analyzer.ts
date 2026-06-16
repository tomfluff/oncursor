import type { IAnnotation, VisualizationData } from "../types/visualization-types";

/**
 * Turns an uploaded chart image into overlay-ready {@link VisualizationData}
 * (title / axis / axis-item / legend annotations with normalized 0..1 bboxes —
 * the exact same shape as the bundled example charts).
 *
 * The actual analysis is a vision-LLM call that needs a secret API key, so it
 * can NOT run in the static site. Instead the app POSTs the image to a small
 * serverless proxy that holds the key server-side. Point VITE_ANALYZE_URL at
 * that proxy to enable uploads; when it is unset, uploads are disabled and the
 * app stays fully static (see {@link isAnalyzeEnabled} / UploadChartButton).
 *
 * Expected proxy contract:
 *   POST   { image: "<data-url>" }
 *   200    { annotations: IAnnotation[]; plotType?: string }
 *          bboxes normalized 0..1, identical to the bundled examples.
 *
 * The proxy lives in a SEPARATE (private) repo/service — the key and the
 * analysis prompt never ship in this public frontend.
 */
const ANALYZE_URL = import.meta.env.VITE_ANALYZE_URL;

/** True when an analyzer endpoint is configured (upload feature available). */
export const isAnalyzeEnabled = Boolean(ANALYZE_URL);

export interface ReadImageResult {
    dataUrl: string;
    width: number;
    height: number;
}

/** Read a File into a data URL plus its intrinsic pixel size. */
export function readImage(file: File): Promise<ReadImageResult> {
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

/** Defensively pull the annotation array out of an analyzer response. */
function asAnnotations(raw: unknown): IAnnotation[] {
    if (Array.isArray(raw)) return raw as IAnnotation[];
    if (
        raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { annotations?: unknown }).annotations)
    ) {
        return (raw as { annotations: IAnnotation[] }).annotations;
    }
    return [];
}

export interface AnalyzeOptions {
    signal?: AbortSignal;
}

/**
 * Send an uploaded image to the analyzer and return overlay-ready data.
 * Image stays local (used as the chart's pngUrl); only the analysis JSON
 * comes back from the proxy. Throws if VITE_ANALYZE_URL is not configured.
 */
export async function analyzeChart(
    file: File,
    opts: AnalyzeOptions = {}
): Promise<VisualizationData> {
    if (!ANALYZE_URL) {
        throw new Error(
            "Chart analysis is disabled (VITE_ANALYZE_URL is not set)."
        );
    }

    const { dataUrl, width, height } = await readImage(file);

    const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
        signal: opts.signal,
    });
    if (!res.ok) {
        throw new Error(`Analyzer responded with ${res.status}.`);
    }

    const raw: unknown = await res.json();

    return {
        id: `upload-${Date.now()}`,
        name: file.name,
        pngUrl: dataUrl,
        width,
        height,
        plotType:
            (raw as { plotType?: string } | null)?.plotType ?? undefined,
        annotations: asAnnotations(raw),
    };
}
