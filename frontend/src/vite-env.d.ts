/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Optional serverless endpoint for the "upload & analyze your own chart"
     * feature. When unset, chart upload is disabled and the app is fully static.
     */
    readonly VITE_ANALYZE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
