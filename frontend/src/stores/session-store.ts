import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export interface ISetting<T = string | number | boolean> {
    name?: string;
    value: T;
    defaultValue?: T;
}

const initialSettingsState = {
    // Overlay (focus box) settings
    overlayWidth: {
        value: 0.3,
        defaultValue: 0.3,
        name: "Overlay Width",
    } as ISetting<number>,
    overlayHeight: {
        value: 0.3,
        defaultValue: 0.3,
        name: "Overlay Height",
    } as ISetting<number>,
    overlayBorderEnabled: {
        value: true,
        defaultValue: true,
        name: "Overlay Border",
    } as ISetting<boolean>,
    overlayBorderColor: {
        value: "#000000",
        defaultValue: "#000000",
        name: "Overlay Border Color",
    } as ISetting<string>,
    overlayBorderWidth: {
        value: 2,
        defaultValue: 2,
        name: "Overlay Border Width",
    } as ISetting<number>,
    overlayDimmingEnabled: {
        value: true,
        defaultValue: true,
        name: "Outside Overlay Dimming",
    } as ISetting<boolean>,
    // Minimap settings
    minimapScale: {
        value: 0.4,
        defaultValue: 0.4,
        name: "Minimap Scale",
    } as ISetting<number>,
    minimapLocation: {
        value: "top right",
        defaultValue: "top right",
        name: "Minimap Location",
    } as ISetting<"top left" | "top right" | "bottom left" | "bottom right">,
    minimapIndicatorScale: {
        value: 0.15,
        defaultValue: 0.15,
        name: "Minimap Indicator Scale",
    } as ISetting<number>,
    minimapIndicatorColor: {
        value: "#000000",
        defaultValue: "#000000",
        name: "Minimap Indicator Color",
    } as ISetting<string>,
    // Overview settings
    overviewCrosshairEnabled: {
        value: true,
        defaultValue: true,
        name: "Overview Crosshair",
    } as ISetting<boolean>,
    overviewCrosshairRatio: {
        value: 1,
        defaultValue: 1,
        name: "Overview Crosshair Ratio",
    } as ISetting<number>,
    overviewCrosshairColor: {
        value: "#000000",
        defaultValue: "#000000",
        name: "Overview Crosshair Color",
    } as ISetting<string>,
    overviewCrosshairOpacity: {
        value: 1,
        defaultValue: 1,
        name: "Overview Crosshair Opacity",
    } as ISetting<number>,
    overviewCrosshairWidth: {
        value: 2,
        defaultValue: 2,
        name: "Overview Crosshair Width",
    } as ISetting<number>,
    overviewSpacing: {
        value: 0.3,
        defaultValue: 0.3,
        name: "Overview Spacing",
    } as ISetting<number>,
};

const initialState = {
    ...initialSettingsState,
};

type actions = {
    reset: <T extends keyof typeof initialSettingsState>(key: T) => void;
    update: <T extends keyof typeof initialSettingsState>(
        key: T,
        value: (typeof initialSettingsState)[T]["value"]
    ) => void;
    initialize: () => void;
};

export type TSession = typeof initialState & actions;

const useSessionStore = create<TSession>()(
    devtools(
        persist(
            (set) => ({
                ...initialState,
                initialize: () => set(() => ({ ...initialState })),
                reset: (key) =>
                    set((state) => ({
                        [key]: {
                            ...state[key],
                            value: state[key].defaultValue,
                        },
                    })),
                update: (key, value) =>
                    set((state) => ({
                        [key]: {
                            ...state[key],
                            value,
                        },
                    })),
            }),
            {
                name: "oncursor-settings", // localStorage key
                storage: createJSONStorage(() => localStorage),
            }
        ),
        {
            name: "OnCursorSettings", // devtools label
            enabled: true,
        }
    )
);
export default useSessionStore;
