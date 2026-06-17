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

export interface IAnnotation {
    id: string;
    bbox: Bbox;
    text?: string;
    type?: string;
    anchor?: string;
    color?: string;
    parent?: string;
    discrete?: boolean;
}

export interface Bbox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
