import { useSearchParams } from "react-router";

export type ConditionId = "none" | "minimap" | "overview";

export interface IUrlVariables {
    conditionId: ConditionId;
}

export const useUrlVariables = (): IUrlVariables => {
    const [searchParams] = useSearchParams();
    const c = searchParams.get("conditionId") || searchParams.get("cid");
    const conditionId: ConditionId =
        c === "minimap" || c === "overview" ? c : "none";
    return { conditionId };
};
