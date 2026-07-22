"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Eye, EyeOff, AlertCircle, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { useSignupStore } from "@/store/signup";

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters")
      .max(255),
    surname: z
      .string()
      .trim()
      .min(2, "Surname must be at least 2 characters")
      .max(255),
    email: z.string().trim().email("Please enter a valid email").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128),
    confirmPassword: z.string(),
    phone: z.string().trim().min(6, "Phone number is too short").max(30),
    country: z.string().min(1, "Please select a country"),
    terms_accepted: z.boolean().refine((v) => v === true, {
      message: "You must accept the terms to continue",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bolivia",
  "Bosnia and Herzegovina", "Brazil", "Bulgaria", "Cambodia", "Cameroon", "Canada", "Chile",
  "China", "Colombia", "Croatia", "Cuba", "Czech Republic", "Denmark", "Ecuador", "Egypt",
  "Estonia", "Ethiopia", "Finland", "France", "Georgia", "Germany", "Ghana", "Greece",
  "Guatemala", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
  "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg", "Malaysia", "Mexico", "Moldova",
  "Morocco", "Nepal", "Netherlands", "New Zealand", "Nigeria", "Norway", "Pakistan",
  "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Saudi Arabia", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia",
  "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland",
  "Taiwan", "Thailand", "Tunisia", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const info =
    score <= 2
      ? { label: "WEAK", color: "bg-red-500", pct: 33 }
      : score <= 3
        ? { label: "MODERATE", color: "bg-amber-500", pct: 66 }
        : { label: "STRONG", color: "bg-[#a3e635]", pct: 100 };

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${info.color}`}
          style={{ width: `${info.pct}%` }}
        />
      </div>
      <p
        className="text-[10px] tracking-widest uppercase text-white/30"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        Strength: <span className={`font-bold ${score <= 2 ? "text-red-400" : score <= 3 ? "text-amber-400" : "text-[#a3e635]"}`}>{info.label}</span>
      </p>
    </div>
  );
}

const inputCls =
  "w-full border border-white/[0.08] rounded-lg px-3 py-2.5 text-sm bg-white/[0.03] " +
  "text-white placeholder:text-white/20 " +
  "focus:outline-none focus:ring-1 focus:ring-[#a3e635]/40 focus:border-[#a3e635]/40 " +
  "disabled:opacity-40 transition-all duration-200 hover:border-white/[0.12]";

const labelCls =
  "block text-[10px] font-bold tracking-widest uppercase text-white/40 mb-1.5";
const errCls = "mt-1 text-[11px] text-red-400";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls} style={{ fontFamily: "var(--font-mono)" }}>{label}</label>
      {children}
      {error && <p className={errCls}>{error}</p>}
    </div>
  );
}

export function ProfileStep() {
  const { setCredentials, nextStep } = useSignupStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      country: "",
      terms_accepted: false,
    },
  });

  const password = watch("password");

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const res = await api.post("/auth/coach/register", {
        name: values.name,
        surname: values.surname,
        email: values.email,
        password: values.password,
        phone: values.phone,
        country: values.country,
        language: "en",
      });
      const { id, setup_token } = res.data.data;
      setCredentials(setup_token, id);
      nextStep();
    } catch (e: unknown) {
      const err = e as {
        response?: { status?: number; data?: { message?: string } };
      };
      if (err?.response?.status === 409) {
        setServerError("An account with this email already exists.");
      } else {
        setServerError(
          err?.response?.data?.message ??
            "Registration failed. Please try again.",
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="First Name *" error={errors.name?.message}>
          <input
            {...register("name")}
            placeholder="Alex"
            disabled={isSubmitting}
            className={inputCls}
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Field>
        <Field label="Last Name *" error={errors.surname?.message}>
          <input
            {...register("surname")}
            placeholder="Johnson"
            disabled={isSubmitting}
            className={inputCls}
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Field>
      </div>

      <Field label="Email Address *" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          placeholder="alex@example.com"
          disabled={isSubmitting}
          className={inputCls}
          style={{ fontFamily: "var(--font-mono)" }}
        />
      </Field>

      <Field label="Password *" error={errors.password?.message}>
        <div className="relative">
          <input
            {...register("password")}
            type={showPw ? "text" : "password"}
            placeholder="Min. 8 characters"
            disabled={isSubmitting}
            className={`${inputCls} pr-10`}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
          >
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <PasswordStrength password={password} />
      </Field>

      <Field label="Confirm Password *" error={errors.confirmPassword?.message}>
        <div className="relative">
          <input
            {...register("confirmPassword")}
            type={showCpw ? "text" : "password"}
            placeholder="Repeat your password"
            disabled={isSubmitting}
            className={`${inputCls} pr-10`}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowCpw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
          >
            {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone *" error={errors.phone?.message}>
          <input
            {...register("phone")}
            type="tel"
            placeholder="+1 555 000 0000"
            disabled={isSubmitting}
            className={inputCls}
            style={{ fontFamily: "var(--font-mono)" }}
          />
        </Field>
        <Field label="Country *" error={errors.country?.message}>
          <select
            {...register("country")}
            disabled={isSubmitting}
            className={inputCls}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <option value="">Select...</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2.5 pt-1">
        <input
          {...register("terms_accepted")}
          type="checkbox"
          id="terms"
          disabled={isSubmitting}
          className="w-4 h-4 mt-0.5 rounded border-white/[0.12] bg-white/[0.03] text-[#a3e635] focus:ring-[#a3e635]/30 cursor-pointer"
        />
        <label
          htmlFor="terms"
          className="text-xs text-white/40 leading-relaxed cursor-pointer"
        >
          I agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            className="text-[#a3e635] hover:text-[#bef264] font-semibold transition-colors"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            className="text-[#a3e635] hover:text-[#bef264] font-semibold transition-colors"
          >
            Privacy Policy
          </a>
        </label>
      </div>
      {errors.terms_accepted && (
        <p className={errCls}>{errors.terms_accepted.message}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#a3e635] hover:bg-[#bef264] active:bg-[#8bc52f] text-[#0a1114] font-bold text-sm py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> INITIALIZING...
          </>
        ) : (
          <>
            CONTINUE <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
