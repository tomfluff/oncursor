import {
    Button,
    ColorInput,
    Divider,
    Grid,
    Group,
    SegmentedControl,
    Slider,
    Stack,
    Switch,
    Tabs,
    Text,
    Title,
} from "@mantine/core";
import {
    IconCrosshair,
    IconFocusCentered,
    IconMap2,
} from "@tabler/icons-react";
import type { ConditionId } from "../hooks/useUrlVariables";
import useSessionStore from "../stores/session-store";

type Props = {
    conditionId: ConditionId;
};

const ratioMarks = [
    { value: 0, label: "0" },
    { value: 0.5, label: "0.5" },
    { value: 1, label: "1" },
];

const pxMarks = [
    { value: 1, label: "1" },
    { value: 5, label: "5" },
    { value: 10, label: "10" },
];

type SliderRowProps = {
    label: string;
    description?: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    marks: { value: number; label: string }[];
    format?: (v: number) => string;
};

const SliderRow = ({
    label,
    description,
    value,
    onChange,
    min,
    max,
    step,
    marks,
    format,
}: SliderRowProps) => (
    <div>
        <Group justify="space-between" gap="xs" mb={2} wrap="nowrap">
            <Text fw={500}>{label}</Text>
            <Text size="sm" c="dimmed" ff="monospace">
                {format ? format(value) : value}
            </Text>
        </Group>
        {description && (
            <Text size="xs" fs="italic" c="dimmed" mb={6}>
                {description}
            </Text>
        )}
        <Slider
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            marks={marks}
            label={format ? format(value) : value}
            mb="md"
        />
    </div>
);

const ratio = (v: number) => v.toFixed(2);
const px = (v: number) => `${v}px`;

const SettingsPanel = ({ conditionId }: Props) => {
    const sessionStore = useSessionStore((state) => state);

    const methodLabel =
        conditionId === "minimap" ? "Mini-map" : "Dynamic Context";
    const methodIcon =
        conditionId === "minimap" ? (
            <IconMap2 size={15} />
        ) : (
            <IconCrosshair size={15} />
        );

    const focusBoxControls = (
        <Stack gap="sm">
            <Text size="sm" fs="italic" c="dimmed">
                The box that follows your cursor and frames the region of
                interest.
            </Text>
            <SliderRow
                label="Width"
                value={sessionStore.overlayWidth.value}
                onChange={(v) => sessionStore.update("overlayWidth", v)}
                step={0.01}
                min={0}
                max={1}
                marks={ratioMarks}
                format={ratio}
            />
            <SliderRow
                label="Height"
                value={sessionStore.overlayHeight.value}
                onChange={(v) => sessionStore.update("overlayHeight", v)}
                step={0.01}
                min={0}
                max={1}
                marks={ratioMarks}
                format={ratio}
            />

            <Divider my="xs" />

            <Group align="center" justify="space-between">
                <Text fw={500}>Border</Text>
                <Switch
                    checked={sessionStore.overlayBorderEnabled.value}
                    onChange={(e) =>
                        sessionStore.update(
                            "overlayBorderEnabled",
                            e.currentTarget.checked,
                        )
                    }
                    onLabel="On"
                    offLabel="Off"
                />
            </Group>
            <Grid gutter="md">
                <Grid.Col span={6}>
                    <Text fw={500} mb={4}>
                        Border Color
                    </Text>
                    <ColorInput
                        value={sessionStore.overlayBorderColor.value}
                        onChange={(v) =>
                            sessionStore.update("overlayBorderColor", v)
                        }
                    />
                </Grid.Col>
                <Grid.Col span={6}>
                    <SliderRow
                        label="Border Width"
                        value={sessionStore.overlayBorderWidth.value}
                        onChange={(v) =>
                            sessionStore.update("overlayBorderWidth", v)
                        }
                        step={1}
                        min={1}
                        max={10}
                        marks={pxMarks}
                        format={px}
                    />
                </Grid.Col>
            </Grid>

            <Group align="center" justify="space-between">
                <div>
                    <Text fw={500}>Dim Outside</Text>
                    <Text size="sm" fs="italic" c="dimmed">
                        Darken everything outside the focus box.
                    </Text>
                </div>
                <Switch
                    checked={sessionStore.overlayDimmingEnabled.value}
                    onChange={(e) =>
                        sessionStore.update(
                            "overlayDimmingEnabled",
                            e.currentTarget.checked,
                        )
                    }
                    onLabel="On"
                    offLabel="Off"
                />
            </Group>
        </Stack>
    );

    const minimapControls = (
        <Stack gap="sm">
            <Text size="sm" fs="italic" c="dimmed">
                A scaled-down copy of the whole chart with an indicator showing
                your current position.
            </Text>
            <SliderRow
                label="Scale"
                value={sessionStore.minimapScale.value}
                onChange={(v) => sessionStore.update("minimapScale", v)}
                step={0.01}
                min={0}
                max={1}
                marks={ratioMarks}
                format={ratio}
            />
            <div>
                <Text fw={500} mb={4}>
                    Location
                </Text>
                <SegmentedControl
                    fullWidth
                    size="xs"
                    value={sessionStore.minimapLocation.value}
                    onChange={(v) =>
                        sessionStore.update(
                            "minimapLocation",
                            v as
                                | "top left"
                                | "top right"
                                | "bottom left"
                                | "bottom right",
                        )
                    }
                    data={[
                        { label: "Top L", value: "top left" },
                        { label: "Top R", value: "top right" },
                        { label: "Bot L", value: "bottom left" },
                        { label: "Bot R", value: "bottom right" },
                    ]}
                />
            </div>
            <SliderRow
                label="Indicator Scale"
                value={sessionStore.minimapIndicatorScale.value}
                onChange={(v) =>
                    sessionStore.update("minimapIndicatorScale", v)
                }
                step={0.01}
                min={0}
                max={1}
                marks={ratioMarks}
                format={ratio}
            />
            <div>
                <Text fw={500} mb={4}>
                    Indicator Color
                </Text>
                <ColorInput
                    value={sessionStore.minimapIndicatorColor.value}
                    onChange={(v) =>
                        sessionStore.update("minimapIndicatorColor", v)
                    }
                />
            </div>
        </Stack>
    );

    const overviewControls = (
        <Stack gap="sm">
            <Text size="sm" fs="italic" c="dimmed">
                Brings the nearest axis labels and legend to your cursor, with
                an optional crosshair for alignment.
            </Text>
            <SliderRow
                label="Axis Spacing"
                value={sessionStore.overviewSpacing.value}
                onChange={(v) => sessionStore.update("overviewSpacing", v)}
                step={0.01}
                min={0}
                max={1}
                marks={ratioMarks}
                format={ratio}
            />

            <Group align="center" justify="space-between">
                <Text fw={500}>Crosshair</Text>
                <Switch
                    checked={sessionStore.overviewCrosshairEnabled.value}
                    onChange={(e) =>
                        sessionStore.update(
                            "overviewCrosshairEnabled",
                            e.currentTarget.checked,
                        )
                    }
                    onLabel="On"
                    offLabel="Off"
                />
            </Group>

            <SliderRow
                label="Crosshair Length"
                value={sessionStore.overviewCrosshairRatio.value}
                onChange={(v) =>
                    sessionStore.update("overviewCrosshairRatio", v)
                }
                step={0.01}
                min={0}
                max={1}
                marks={ratioMarks}
                format={ratio}
            />

            <Grid gutter="md">
                <Grid.Col span={6}>
                    <Text fw={500} mb={4}>
                        Crosshair Color
                    </Text>
                    <ColorInput
                        value={sessionStore.overviewCrosshairColor.value}
                        onChange={(v) =>
                            sessionStore.update("overviewCrosshairColor", v)
                        }
                    />
                </Grid.Col>
                <Grid.Col span={6}>
                    <SliderRow
                        label="Crosshair Width"
                        value={sessionStore.overviewCrosshairWidth.value}
                        onChange={(v) =>
                            sessionStore.update("overviewCrosshairWidth", v)
                        }
                        step={1}
                        min={1}
                        max={10}
                        marks={pxMarks}
                        format={px}
                    />
                </Grid.Col>
            </Grid>

            <SliderRow
                label="Crosshair Opacity"
                value={sessionStore.overviewCrosshairOpacity.value}
                onChange={(v) =>
                    sessionStore.update("overviewCrosshairOpacity", v)
                }
                step={0.01}
                min={0}
                max={1}
                marks={ratioMarks}
                format={ratio}
            />
        </Stack>
    );

    return (
        <Stack gap="sm" p="md">
            <Group justify="space-between" align="center">
                <Title order={4}>Settings</Title>
                <Button
                    size="xs"
                    variant="subtle"
                    onClick={() => sessionStore.initialize()}
                >
                    Reset all
                </Button>
            </Group>

            {conditionId === "none" ? (
                <Text c="dimmed" fs="italic" size="sm">
                    No interaction method selected. Choose Mini-map or Dynamic
                    Context to reveal its settings.
                </Text>
            ) : (
                <Tabs
                    defaultValue="focus"
                    variant="outline"
                    keepMounted={false}
                >
                    <Tabs.List grow mb="sm">
                        <Tabs.Tab
                            value="focus"
                            leftSection={<IconFocusCentered size={15} />}
                        >
                            Focus Box
                        </Tabs.Tab>
                        <Tabs.Tab value="method" leftSection={methodIcon}>
                            {methodLabel}
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="focus">{focusBoxControls}</Tabs.Panel>
                    <Tabs.Panel value="method">
                        {conditionId === "minimap"
                            ? minimapControls
                            : overviewControls}
                    </Tabs.Panel>
                </Tabs>
            )}
        </Stack>
    );
};

export default SettingsPanel;
