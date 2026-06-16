import "@mantine/core/styles.css";

import { createTheme, MantineProvider } from "@mantine/core";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import DemoPage from "./pages/demo/demo-page";

const theme = createTheme({});

// Clean URLs (e.g. /oncursor/?viz=...). On GitHub Pages this relies on the
// 404.html fallback generated at build time (see vite.config.ts) so deep links
// and refreshes resolve to the SPA instead of a 404.
// basename matches the Vite base ("/oncursor"); "/" when served from root.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

function App() {
    return (
        <MantineProvider theme={theme} defaultColorScheme="light">
            <BrowserRouter basename={basename}>
                <Routes>
                    <Route path="/" element={<DemoPage />} />
                    {/* Future: <Route path="/embed" element={<EmbedPage />} /> */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </MantineProvider>
    );
}

export default App;
