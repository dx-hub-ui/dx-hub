"use client";

import type { ChangeEventHandler } from "react";
import styles from "./DashboardFilterBar.module.css";

export type DashboardRole = "owner" | "leader" | "rep";

export type DashboardFilterOption = {
  value: string;
  label: string;
};

export type DashboardRoleOption = DashboardFilterOption & {
  value: DashboardRole;
};

export interface DashboardFilterBarLabels {
  role: string;
  period: string;
  scope: string;
  funnelStage: string;
}

export interface DashboardFilterBarProps {
  className?: string;
  sectionLabel?: string;
  role: DashboardRole;
  onRoleChange: (role: DashboardRole) => void;
  roleOptions: DashboardRoleOption[];
  period: string;
  onPeriodChange: (value: string) => void;
  periodOptions: DashboardFilterOption[];
  scope: string;
  onScopeChange: (value: string) => void;
  scopeOptions: DashboardFilterOption[];
  funnelStage: string;
  onFunnelStageChange: (value: string) => void;
  funnelOptions: DashboardFilterOption[];
  labels: DashboardFilterBarLabels;
}

function handleSelectChange(handler: (value: string) => void): ChangeEventHandler<HTMLSelectElement> {
  return (event) => handler(event.target.value);
}

export function DashboardFilterBar({
  className,
  sectionLabel,
  role,
  onRoleChange,
  roleOptions,
  period,
  onPeriodChange,
  periodOptions,
  scope,
  onScopeChange,
  scopeOptions,
  funnelStage,
  onFunnelStageChange,
  funnelOptions,
  labels,
}: DashboardFilterBarProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(" ");
  const ariaLabel = sectionLabel ?? labels.role;

  return (
    <section className={rootClassName} aria-label={ariaLabel}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{labels.role}</legend>
        <div className={styles.roleGroup} role="group" aria-label={labels.role}>
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.roleButton}
              aria-pressed={option.value === role}
              onClick={() => onRoleChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="dashboard-period">
          {labels.period}
        </label>
        <select
          id="dashboard-period"
          name="dashboard-period"
          className={styles.select}
          value={period}
          onChange={handleSelectChange(onPeriodChange)}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="dashboard-scope">
          {labels.scope}
        </label>
        <select
          id="dashboard-scope"
          name="dashboard-scope"
          className={styles.select}
          value={scope}
          onChange={handleSelectChange(onScopeChange)}
        >
          {scopeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="dashboard-funnel">
          {labels.funnelStage}
        </label>
        <select
          id="dashboard-funnel"
          name="dashboard-funnel"
          className={styles.select}
          value={funnelStage}
          onChange={handleSelectChange(onFunnelStageChange)}
          aria-disabled={funnelOptions.length <= 1}
          disabled={funnelOptions.length <= 1}
        >
          {funnelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
