"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DxBadge, DxButton, DxCard, DxInput, DxToast, useTelemetry } from "@dx/ui";
import {
  MICROSITE_DOWNLINES,
  MICROSITE_MEMBERS,
  MICROSITES_SEED,
  createLeadId,
} from "@/microsites/mock-data";
import type { MicrositeMember, MicrositeRecord } from "@/microsites/types";
import { useTranslation } from "@/i18n/I18nProvider";
import {
  MICROSITE_LEADS_STORAGE_KEY,
  MICROSITE_RATE_LIMIT_PREFIX,
} from "@/microsites/storage";

interface MicrositePublicClientProps {
  orgId: string;
  slug: string;
}

type FormState = {
  name: string;
  email: string;
  phone: string;
  message: string;
  captcha: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

type CaptchaChallenge = {
  question: string;
  answer: string;
};

function resolveMicrosite(orgId: string, slug: string): MicrositeRecord {
  const record = MICROSITES_SEED.find((item) => item.orgId === orgId && item.slug === slug);

  if (record) {
    return record;
  }

  return {
    id: `preview-${slug}`,
    orgId,
    ownerId: "member-owner",
    ownerName: "Equipe DX",
    ownerRole: "owner",
    slug,
    title: `Microsite ${slug}`,
    headline: "Microsite em configuração",
    description:
      "Este microsite ainda está em modo de edição. O formulário permanecerá disponível para capturar feedback interno.",
    status: "draft",
    theme: "light",
    lastPublishedAt: null,
    totalLeads: 0,
    lastLeadAt: null,
    showContactPhone: true,
    enableCaptcha: true,
  };
}

function resolveAssignment(record: MicrositeRecord): MicrositeMember {
  if (record.ownerRole === "rep") {
    return MICROSITE_MEMBERS.find((member) => member.id === record.ownerId) ?? MICROSITE_MEMBERS[0];
  }

  const downline = MICROSITE_DOWNLINES[record.ownerId] ?? [];
  const rep = downline
    .map((id) => MICROSITE_MEMBERS.find((member) => member.id === id))
    .filter(Boolean)
    .find((member) => member?.role === "rep");

  return (rep as MicrositeMember) ?? MICROSITE_MEMBERS.find((member) => member.id === record.ownerId)!;
}

function buildCaptcha(seed: number): CaptchaChallenge {
  const a = (seed % 5) + 2;
  const b = ((seed * 3) % 4) + 3;
  return {
    question: `${a} + ${b} = ?`,
    answer: String(a + b),
  };
}

export function MicrositePublicClient({ orgId, slug }: MicrositePublicClientProps) {
  const telemetry = useTelemetry();
  const micrositeDictionary = useTranslation("microsites");
  const tMicrosites = micrositeDictionary.t;
  const { t: tCommon } = useTranslation("common");

  const record = resolveMicrosite(orgId, slug);
  const assignedMember = resolveAssignment(record);

  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    message: "",
    captcha: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastVariant, setToastVariant] = useState<"primary" | "danger" | "success">("primary");
  const [toastOpen, setToastOpen] = useState(false);
  const [captchaSeed, setCaptchaSeed] = useState<number>(() => Math.floor(Math.random() * 1000));

  const captcha = useMemo(() => buildCaptcha(captchaSeed), [captchaSeed]);
  const publicUrl = `/m/${record.orgId}/${record.slug}`;

  function updateField(key: keyof FormState, value: string) {
    setFormState((current) => ({ ...current, [key]: value }));
    setFormErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validate(): boolean {
    const errors: FormErrors = {};

    if (!formState.name.trim()) {
      errors.name = tMicrosites("public.errors.required");
    }

    if (!formState.email.trim()) {
      errors.email = tMicrosites("public.errors.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      errors.email = tMicrosites("public.errors.email");
    }

    if (record.showContactPhone && !formState.phone.trim()) {
      errors.phone = tMicrosites("public.errors.required");
    }

    if (record.enableCaptcha) {
      if (!formState.captcha.trim()) {
        errors.captcha = tMicrosites("public.errors.required");
      } else if (formState.captcha.trim() !== captcha.answer) {
        errors.captcha = tMicrosites("public.errors.captcha");
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openToast(message: string, variant: "primary" | "danger" | "success" = "primary") {
    setToastMessage(message);
    setToastVariant(variant);
    setToastOpen(true);
  }

  function storeLead() {
    const lead = {
      id: createLeadId(),
      micrositeId: record.id,
      name: formState.name.trim(),
      email: formState.email.trim(),
      phone: record.showContactPhone ? formState.phone.trim() : undefined,
      message: formState.message.trim() || undefined,
      createdAt: new Date().toISOString(),
      assignedMemberId: assignedMember.id,
    };

    if (typeof window === "undefined") {
      return lead;
    }

    try {
      const raw = window.localStorage.getItem(MICROSITE_LEADS_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as typeof lead[]) : [];
      const next = Array.isArray(parsed) ? [...parsed, lead] : [lead];
      window.localStorage.setItem(MICROSITE_LEADS_STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to persist microsite lead", error);
    }

    return lead;
  }

  function storeRateLimit() {
    if (typeof window === "undefined") {
      return;
    }
    const key = `${MICROSITE_RATE_LIMIT_PREFIX}${record.slug}`;
    window.localStorage.setItem(key, String(Date.now()));
  }

  function checkRateLimit(): boolean {
    if (typeof window === "undefined") {
      return false;
    }
    const key = `${MICROSITE_RATE_LIMIT_PREFIX}${record.slug}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return false;
    }
    const last = Number(raw);
    return Number.isFinite(last) && Date.now() - last < 60_000;
  }

  function resetForm() {
    setFormState({ name: "", email: "", phone: "", message: "", captcha: "" });
    setCaptchaSeed(Math.floor(Math.random() * 1000));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    if (!validate()) {
      return;
    }

    if (checkRateLimit()) {
      openToast(tMicrosites("public.rateLimit"), "danger");
      return;
    }

    setSubmitting(true);

    try {
      const lead = storeLead();
      storeRateLimit();

      telemetry.capture("microsite_lead_submitted", {
        microsite_id: record.id,
        slug: record.slug,
        org_id: record.orgId,
        assigned_member_id: assignedMember.id,
      });
      telemetry.capture("crm_contact_created", {
        source: "microsite",
        microsite_id: record.id,
        role: assignedMember.role,
      });

      openToast(tMicrosites("public.success"), "success");
      resetForm();
      return lead;
    } catch (error) {
      console.error("Microsite submit error", error);
      openToast(tMicrosites("public.genericError"), "danger");
    } finally {
      setSubmitting(false);
    }
  }

  const assignedLabel = `${assignedMember.name} (${tMicrosites(`roles.${assignedMember.role}`)})`;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-3">
        <DxBadge size="sm" variant={record.status === "published" ? "primary" : "secondary"}>
          {tMicrosites(`status.${record.status}`)}
        </DxBadge>
        <h1 className="text-3xl font-semibold text-[#0f172a]">{record.title}</h1>
        <p className="text-base text-[#475569]">{record.headline}</p>
        <p className="text-sm text-[#475569]">{record.description}</p>
      </header>

      <DxCard className="flex flex-col gap-4 bg-white" padding="large">
        <div className="flex flex-col gap-1 text-sm text-[#475569]">
          <span>{tMicrosites("public.assignedTo", { values: { member: assignedLabel } })}</span>
          <span>
            {tMicrosites("public.responseSla", {
              values: { time: record.status === "published" ? "4h" : "1 dia útil" },
            })}
          </span>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <DxInput
            label={tMicrosites("public.form.name")}
            name="name"
            value={formState.name}
            onChange={(value) => updateField("name", value)}
            validationStatus={formErrors.name ? "error" : undefined}
            helperText={formErrors.name}
            placeholder={tMicrosites("public.form.namePlaceholder")}
          />
          <DxInput
            label={tMicrosites("public.form.email")}
            name="email"
            value={formState.email}
            onChange={(value) => updateField("email", value)}
            validationStatus={formErrors.email ? "error" : undefined}
            helperText={formErrors.email}
            placeholder="nome@empresa.com"
          />
          {record.showContactPhone ? (
            <DxInput
              label={tMicrosites("public.form.phone")}
              name="phone"
              value={formState.phone}
              onChange={(value) => updateField("phone", value)}
              validationStatus={formErrors.phone ? "error" : undefined}
              helperText={formErrors.phone}
              placeholder="(+55) 11 90000-0000"
            />
          ) : null}
          <DxInput
            label={tMicrosites("public.form.message")}
            name="message"
            value={formState.message}
            onChange={(value) => updateField("message", value)}
            placeholder={tMicrosites("public.form.messagePlaceholder")}
            multiline
            rows={4}
          />
          {record.enableCaptcha ? (
            <div className="flex flex-col gap-2">
              <DxInput
                label={tMicrosites("public.form.captcha", { values: { challenge: captcha.question } })}
                name="captcha"
                value={formState.captcha}
                onChange={(value) => updateField("captcha", value)}
                validationStatus={formErrors.captcha ? "error" : undefined}
                helperText={formErrors.captcha}
                placeholder="?"
              />
              <button
                type="button"
                className="self-start text-xs text-[#2563eb]"
                onClick={() => setCaptchaSeed(Math.floor(Math.random() * 1000))}
              >
                {tMicrosites("public.form.tryAnother")}
              </button>
            </div>
          ) : null}
          <DxButton type="submit" disabled={submitting}>
            {submitting ? tCommon("actions.sending") : tMicrosites("public.form.submit")}
          </DxButton>
        </form>
      </DxCard>

      <DxCard className="flex flex-col gap-3 bg-white" padding="large">
        <h2 className="text-lg font-semibold text-[#0f172a]">{tMicrosites("public.share.title")}</h2>
        <p className="text-sm text-[#475569]">{tMicrosites("public.share.copy")}</p>
        <code className="rounded border border-[#cbd5f5] bg-[#f8fafc] px-3 py-1 text-xs text-[#0f172a]">{publicUrl}</code>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#2563eb]">
          <Link href="/" className="hover:underline">
            {tMicrosites("public.share.internal")}
          </Link>
          <span aria-hidden className="text-[#94a3b8]">
            {tMicrosites("public.share.separator")}
          </span>
          <Link href="/microsites" className="hover:underline">
            {tMicrosites("public.share.manage")}
          </Link>
        </div>
      </DxCard>

      <DxToast open={toastOpen} variant={toastVariant} onClose={() => setToastOpen(false)}>
        {toastMessage}
      </DxToast>
    </main>
  );
}
