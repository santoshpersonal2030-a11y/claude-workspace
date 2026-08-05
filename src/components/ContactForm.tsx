"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-xl border border-saffron-200 bg-cream px-3 py-2.5 text-sm outline-none focus:border-saffron-400 focus:ring-2 focus:ring-saffron-100";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.message.trim()) {
      setError("Please enter your name and a message.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong.");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-saffron-100 bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">🙏</div>
        <h3 className="mt-3 font-heading text-xl text-maroon-700">
          Message sent
        </h3>
        <p className="mt-2 text-sm text-foreground/65">
          Thank you for reaching out. Our team will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-2xl border border-saffron-100 bg-white p-6 shadow-sm"
    >
      {/* Every field carries an aria-label. A placeholder is NOT a label: it is announced
          inconsistently, and it disappears the moment the visitor starts typing — so anyone
          using a screen reader, or anyone who looks away mid-form, is left with five identical
          empty boxes. aria-label was chosen over a visible <label> because it fixes the defect
          without altering the design, which is not mine to change. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          aria-label="Your name (required)"
          required
          placeholder="Your name *"
          value={form.name}
          onChange={update("name")}
          className={inputClass}
        />
        <input
          type="email"
          aria-label="Email address"
          placeholder="Email"
          value={form.email}
          onChange={update("email")}
          className={inputClass}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="tel"
          aria-label="Phone number"
          placeholder="Phone"
          value={form.phone}
          onChange={update("phone")}
          className={inputClass}
        />
        <input
          aria-label="Subject"
          placeholder="Subject"
          value={form.subject}
          onChange={update("subject")}
          className={inputClass}
        />
      </div>
      <textarea
        aria-label="How can we help? (required)"
        required
        placeholder="How can we help? *"
        rows={5}
        value={form.message}
        onChange={update("message")}
        className={inputClass}
      />

      {/* role="alert" so the failure is spoken when it appears. Without it the message is drawn
          on screen and a screen-reader user is simply told nothing. */}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-maroon-50 px-3 py-2 text-sm text-maroon-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-saffron-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-saffron-800 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
