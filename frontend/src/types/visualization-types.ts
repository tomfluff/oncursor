export type VisualizationData = {
    id: string;
    width: number;
    height: number;
    name?: string;
    plotType?: string;
    pngUrl?: string;
    svgUrl?: string;
    annotations?: IAnnotation[];
};

export type AxisOrientation = "horizontal" | "vertical";

export interface IAnnotation {
    id: string;
    bbox: Bbox;
    text?: string;
    type?: string;
    anchor?: string;
    color?: string;
    parent?: string;
    discrete?: boolean;
    /** Axes only. When unset, it is inferred from the axis's tick labels. */
    orientation?: AxisOrientation;
}

export interface Bbox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
