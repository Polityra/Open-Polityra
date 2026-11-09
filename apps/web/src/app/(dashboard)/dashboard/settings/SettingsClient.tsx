/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import {
  User,
  KeyRound,
  SlidersHorizontal,
  Bell,
  ShieldCheck,
  LogOut,
  Loader2,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePreferences, DEFAULT_PREFERENCES } from "@/lib/preferences";
import {
  canChangePassword,
  canUpdateProfile,
  changePassword,
  updateProfile,
} from "@/lib/settings-api";
import {
  PageHeader,
  Badge,
  ErrorNote,
  InfoNote,
  LoadingBlock,
  panel,
  sectionTitle,
  inputClass,
  btnPrimary,
  btnGhost,
} from "@/components/dashboard/kit";

const label = "mb-1.5 block text-sm font-medium text-neutral-700";

function Section({
  id,
  icon: Icon,
  title,
  text,
  children,
}: {
  id: string;
  icon: any;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={`${panel} scroll-mt-24 p-6`}>
      <div className="flex items-start gap-3">
        <span className="rounded-lg border border-black/10 bg-neutral-100 p-2.5 text-neutral-900">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-950">{title}</h2>
          <p className="mt-0.5 text-sm text-neutral-600">{text}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  text,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-neutral-950">{title}</p>
        <p className="text-xs text-neutral-500">{text}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition ${checked ? "border-neutral-950 bg-neutral-950" : "border-black/15 bg-neutral-200"}`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-all ${checked ? "left-[1.4rem]" : "left-0.5"}`}
          style={{ height: "1.125rem", width: "1.125rem" }}
        />
      </button>
    </div>
  );
}

function Status({ state }: { state: { type: "ok" | "error"; text: string } | null }) {
  if (!state) return null;
  return state.type === "ok" ? (
    <p role="status" className="flex items-center gap-1.5 text-sm text-emerald-700">
      <Check className="h-4 w-4" />
      {state.text}
    </p>
  ) : (
    <ErrorNote>{state.text}</ErrorNote>
  );
}

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function SettingsClient() {
  const auth = useAuth() as any;
  const user = auth?.user;
  const { prefs, update, reset, ready } = usePreferences();

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  useEffect(() => {
    setDisplayName(user?.name ?? "");
  }, [user]);

  // Password
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const profileEditable = canUpdateProfile();
  const passwordEditable = canChangePassword();
  const strong = strength(next);
  const pwValid = current.length > 0 && next.length >= 8 && next === confirm && next !== current;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await updateProfile(displayName.trim());
      await auth?.refreshUser?.();
      setProfileMsg({ type: "ok", text: "Profile saved." });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Could not save your profile.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwValid) return;
    setSavingPw(true);
    setPwMsg(null);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setPwMsg({ type: "ok", text: "Password updated." });
    } catch (err) {
      setPwMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Could not update your password.",
      });
    } finally {
      setSavingPw(false);
    }
  }

  if (auth?.isLoading)
    return (
      <div className={panel}>
        <LoadingBlock label="Loading your settings…" />
      </div>
    );
  if (!auth?.isAuthenticated || !user) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Account"
          accent="Settings"
          description="Manage your profile, security and preferences."
        />
        <ErrorNote>You need to be signed in to view your settings.</ErrorNote>
      </div>
    );
  }

  const role = String(user.role ?? "viewer");
  const nav = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: KeyRound },
    { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account", label: "Account", icon: ShieldCheck },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Account"
        accent="Settings"
        description="Manage your profile, security and preferences."
      />

      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1">
            {nav.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-black/5 hover:text-neutral-950"
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          {/* Profile */}
          <Section
            id="profile"
            icon={User}
            title="Profile"
            text="How you appear across the platform."
          >
            <form onSubmit={saveProfile} className="space-y-5">
              <div>
                <label htmlFor="s-name" className={label}>
                  Display name
                </label>
                <input
                  id="s-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={255}
                  disabled={!profileEditable}
                  className={`${inputClass} disabled:opacity-60`}
                  placeholder="Your name"
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-email" className={label}>
                    Email
                  </label>
                  <input
                    id="s-email"
                    value={user.email ?? ""}
                    readOnly
                    className={`${inputClass} opacity-70`}
                  />
                </div>
                <div>
                  <label htmlFor="s-role" className={label}>
                    Role
                  </label>
                  <input
                    id="s-role"
                    value={role}
                    readOnly
                    className={`${inputClass} capitalize opacity-70`}
                  />
                </div>
              </div>
              {!profileEditable && (
                <InfoNote tone="warning">
                  Profile editing isn&apos;t available yet. It needs an update endpoint on the API (
                  <code className="font-mono">PATCH /users/me</code>).
                </InfoNote>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={!profileEditable || savingProfile || !displayName.trim()}
                >
                  {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}Save profile
                </button>
                <Status state={profileMsg} />
              </div>
            </form>
          </Section>

          {/* Security */}
          <Section
            id="security"
            icon={KeyRound}
            title="Security"
            text="Change the password you use to sign in."
          >
            <form onSubmit={savePassword} className="space-y-5">
              <div>
                <label htmlFor="s-cur" className={label}>
                  Current password
                </label>
                <input
                  id="s-cur"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  disabled={!passwordEditable}
                  className={`${inputClass} disabled:opacity-60`}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="s-new" className={label}>
                    New password
                  </label>
                  <input
                    id="s-new"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={next}
                    onChange={(e) => setNext(e.target.value)}
                    disabled={!passwordEditable}
                    className={`${inputClass} disabled:opacity-60`}
                  />
                  <div className="mt-2 flex gap-1" aria-hidden>
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full ${i <= strong ? (strong >= 3 ? "bg-[#22c55e]" : strong === 2 ? "bg-[#f59e0b]" : "bg-[#ef4444]") : "bg-neutral-200"}`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    At least 8 characters. Longer, mixed passwords are stronger.
                  </p>
                </div>
                <div>
                  <label htmlFor="s-conf" className={label}>
                    Confirm new password
                  </label>
                  <input
                    id="s-conf"
                    type={show ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    disabled={!passwordEditable}
                    className={`${inputClass} disabled:opacity-60`}
                  />
                  {confirm && next !== confirm && (
                    <p className="mt-1 text-xs text-red-600">Passwords don&apos;t match.</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-950"
              >
                {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {show ? "Hide" : "Show"} passwords
              </button>
              {!passwordEditable && (
                <InfoNote tone="warning">
                  Password changes aren&apos;t available yet. They need an endpoint on the API (
                  <code className="font-mono">POST /users/me/password</code>).
                </InfoNote>
              )}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  className={btnPrimary}
                  disabled={!passwordEditable || !pwValid || savingPw}
                >
                  {savingPw && <Loader2 className="h-4 w-4 animate-spin" />}Update password
                </button>
                <Status state={pwMsg} />
              </div>
            </form>
          </Section>

          {/* Preferences */}
          <Section
            id="preferences"
            icon={SlidersHorizontal}
            title="Preferences"
            text="Saved in this browser only."
          >
            {!ready ? (
              <LoadingBlock />
            ) : (
              <div className="space-y-5">
                <div>
                  <label htmlFor="s-model" className={label}>
                    Default AI model
                  </label>
                  <input
                    id="s-model"
                    value={prefs.defaultModel}
                    onChange={(e) => update({ defaultModel: e.target.value })}
                    placeholder={DEFAULT_PREFERENCES.defaultModel}
                    className={`${inputClass} font-mono`}
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Used to prefill the model field for new AI analyses.
                  </p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="s-time" className={label}>
                      Time display
                    </label>
                    <select
                      id="s-time"
                      value={prefs.timeDisplay}
                      onChange={(e) => update({ timeDisplay: e.target.value as any })}
                      className={inputClass}
                    >
                      <option value="local">My local time</option>
                      <option value="utc">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="s-density" className={label}>
                      Table density
                    </label>
                    <select
                      id="s-density"
                      value={prefs.density}
                      onChange={(e) => update({ density: e.target.value as any })}
                      className={inputClass}
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>
                <button type="button" onClick={reset} className={btnGhost}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to defaults
                </button>
              </div>
            )}
          </Section>

          {/* Notifications */}
          <Section
            id="notifications"
            icon={Bell}
            title="Notifications"
            text="Choose which events you want to be told about."
          >
            {!ready ? (
              <LoadingBlock />
            ) : (
              <div className="divide-y divide-black/[0.08]">
                <Toggle
                  checked={prefs.notifyAnalysisDone}
                  onChange={(v) => update({ notifyAnalysisDone: v })}
                  title="Analysis completed"
                  text="When an analysis you started finishes."
                />
                <Toggle
                  checked={prefs.notifyWorkflowFailed}
                  onChange={(v) => update({ notifyWorkflowFailed: v })}
                  title="AI workflow failed"
                  text="When an AI workflow stops with an error."
                />
                <Toggle
                  checked={prefs.notifyReportPublished}
                  onChange={(v) => update({ notifyReportPublished: v })}
                  title="Report published"
                  text="When a new report is published."
                />
              </div>
            )}
          </Section>

          {/* Account */}
          <Section
            id="account"
            icon={ShieldCheck}
            title="Account"
            text="Your access level and session."
          >
            <dl className="grid gap-4 sm:grid-cols-3">
              <div>
                <dt className={sectionTitle}>Role</dt>
                <dd className="mt-1.5">
                  <Badge tone="info">
                    <span className="capitalize">{role}</span>
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className={sectionTitle}>Status</dt>
                <dd className="mt-1.5">
                  <Badge tone={user.is_active === false ? "danger" : "success"}>
                    {user.is_active === false ? "Inactive" : "Active"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className={sectionTitle}>Member since</dt>
                <dd className="mt-1.5 text-sm text-neutral-950">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                </dd>
              </div>
            </dl>
            {typeof auth.logout === "function" && (
              <button
                type="button"
                onClick={() => auth.logout()}
                className={`${btnGhost} mt-6 hover:border-[#ef4444]/40 hover:text-red-600`}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
