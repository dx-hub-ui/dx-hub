"use client";

import { DxButton, DxCard } from "@dx/ui";
import type { ReactNode } from "react";
import styles from "./WidgetPlaceholder.module.css";

export interface WidgetPlaceholderProps {
  title: string;
  caption?: string;
  description?: string;
  children?: ReactNode;
  actions?: ReactNode;
  metric?: string;
  metricDescription?: string;
  variant?: "primary" | "ghost";
  ariaLive?: "off" | "polite" | "assertive";
  className?: string;
}

export function WidgetPlaceholder({
  title,
  caption,
  description,
  children,
  actions,
  metric,
  metricDescription,
  variant = "primary",
  ariaLive = "off",
  className,
}: WidgetPlaceholderProps) {
  const metricMarkup = metric ? (
    <div role="status" aria-live={ariaLive} className={styles.metricWrapper}>
      <span className={styles.metricValue}>{metric}</span>
      {metricDescription ? <span className={styles.metricDescription}>{metricDescription}</span> : null}
    </div>
  ) : null;

  const cardClassName = [styles.card, className].filter(Boolean).join(" ");

  return (
    <DxCard className={cardClassName} variant={variant} density="compact">
      <header className={styles.header}>
        {caption ? <span className={styles.caption}>{caption}</span> : null}
        <h3 className={styles.title}>{title}</h3>
      </header>
      {description ? <p className={styles.body}>{description}</p> : null}
      {children}
      {metricMarkup}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </DxCard>
  );
}

export function WidgetPlaceholderAction({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <DxButton size="md" density="compact" variant="secondary" onClick={onClick}>
      {children}
    </DxButton>
  );
}
