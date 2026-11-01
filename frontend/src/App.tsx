import "@mantine/core/styles.css";

import {
    createTheme,
    localStorageColorSchemeManager,
    MantineProvider,
} from "@mantine/core";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import DemoPage from "./pages/demo/demo-page";

const theme = createTheme({});

// Mantine's default key is shared by every page on the same origin, so another
// page on the site could flip this app's theme. index.html reads this key too.
const colorSchemeManager = localStorageColorSchemeManager({
    key: "oncursor-color-scheme",
});

// Clean URLs (e.g. /oncursor/?viz=...). On GitHub Pages this relies on the
// 404.html fallback generated at build time (see vite.config.ts) so deep links
// and refreshes resolve to the SPA instead of a 404.
// basename matches the Vite base ("/oncursor"); "/" when served from root.
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

function App() {
    return (
        <MantineProvider
            theme={theme}
            defaultColorScheme="auto"
            colorSchemeManager={colorSchemeManager}
        >
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
