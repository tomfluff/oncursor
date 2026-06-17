import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export interface ISetting<T = string | number | boolean> {
    value: T;
    defaultValue?: T;
}

const initialSettingsState = {
    // Overlay (focus box) settings
    overlayWidth: {
        value: 0.3,
        defaultValue: 0.3,
    } as ISetting<number>,
    overlayHeight: {
        value: 0.3,
        defaultValue: 0.3,
    } as ISetting<number>,
    overlayBorderEnabled: {
        value: true,
        defaultValue: true,
    } as ISetting<boolean>,
    overlayBorderColor: {
        value: "#000000",
        defaultValue: "#000000",
    } as ISetting<string>,
    overlayBorderWidth: {
        value: 2,
        defaultValue: 2,
    } as ISetting<number>,
    overlayDimmingEnabled: {
        value: true,
        defaultValue: true,
    } as ISetting<boolean>,
    // Minimap settings
    minimapScale: {
        value: 0.4,
        defaultValue: 0.4,
    } as ISetting<number>,
    minimapLocation: {
        value: "top right",
        defaultValue: "top right",
    } as ISetting<"top left" | "top right" | "bottom left" | "bottom right">,
    minimapIndicatorScale: {
        value: 0.15,
        defaultValue: 0.15,
    } as ISetting<number>,
    minimapIndicatorColor: {
        value: "#000000",
        defaultValue: "#000000",
    } as ISetting<string>,
    // Overview settings
    overviewCrosshairEnabled: {
        value: true,
        defaultValue: true,
    } as ISetting<boolean>,
    overviewCrosshairRatio: {
        value: 1,
        defaultValue: 1,
    } as ISetting<number>,
    overviewCrosshairColor: {
        value: "#000000",
        defaultValue: "#000000",
    } as ISetting<string>,
    overviewCrosshairOpacity: {
        value: 1,
        defaultValue: 1,
    } as ISetting<number>,
    overviewCrosshairWidth: {
        value: 2,
        defaultValue: 2,
    } as ISetting<number>,
    overviewSpacing: {
        value: 0.3,
        defaultValue: 0.3,
    } as ISetting<number>,
};

type actions = {
    reset: <T extends keyof typeof initialSettingsState>(key: T) => void;
    update: <T extends keyof typeof initialSettingsState>(
        key: T,
        value: (typeof initialSettingsState)[T]["value"]
    ) => void;
    initialize: () => void;
};

export type TSession = typeof initialSettingsState & actions;

const useSessionStore = create<TSession>()(
    devtools(
        persist(
            (set) => ({
                ...initialSettingsState,
                initialize: () => set(() => ({ ...initialSettingsState })),
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
            enabled: process.env.NODE_ENV !== "production",
        }
    )
);
export default useSessionStore;
