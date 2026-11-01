import {
    Center,
    type MantineColorScheme,
    SegmentedControl,
    Tooltip,
    useMantineColorScheme,
    VisuallyHidden,
} from "@mantine/core";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { flushSync } from "react-dom";

const OPTIONS: {
    value: MantineColorScheme;
    label: string;
    Icon: typeof IconSun;
}[] = [
    { value: "auto", label: "System", Icon: IconDeviceDesktop },
    { value: "dark", label: "Dark", Icon: IconMoon },
    { value: "light", label: "Light", Icon: IconSun },
];

const ThemeToggle = () => {
    const { colorScheme, setColorScheme } = useMantineColorScheme();

    // Crossfades between themes where the browser can, and switches instantly
    // for anyone who asks for reduced motion.
    const changeScheme = (value: string) => {
        const scheme = value as MantineColorScheme;
        const canFade =
            typeof document.startViewTransition === "function" &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (canFade) {
            document.startViewTransition(() =>
                flushSync(() => setColorScheme(scheme))
            );
        } else {
            setColorScheme(scheme);
        }
    };

    return (
        <SegmentedControl
            size="xs"
            aria-label="Theme"
            value={colorScheme}
            onChange={changeScheme}
            data={OPTIONS.map(({ value, label, Icon }) => ({
                value,
                label: (
                    <Tooltip label={`${label} theme`} withArrow>
                        <Center>
                            <Icon size={15} aria-hidden />
                            <VisuallyHidden>{label}</VisuallyHidden>
                        </Center>
                    </Tooltip>
                ),
            }))}
        />
    );
};

export default ThemeToggle;
