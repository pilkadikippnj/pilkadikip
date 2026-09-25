"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { InstitutionalLogos } from "@/components/BrandElements";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import {
  ShieldCheck,
  UserCheck,
  Lock,
  AlertCircle,
  ArrowRight,
  KeyRound,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isAdminTab, setIsAdminTab] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (isAdminTab) {
      if (!password) {
        setErrorMessage("Silakan masukkan kata sandi administrator.");
        return;
      }
    } else {
      if (!identifier || !password) {
        setErrorMessage("Email dan kata sandi wajib diisi.");
        return;
      }
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: isAdminTab ? "admin" : identifier.trim(),
          password: password.trim(),
          role: isAdminTab ? "admin" : "voter",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Gagal masuk ke sistem.");
        setLoading(false);
        return;
      }

      if (isAdminTab) {
        window.location.assign("/admin");
      } else {
        if (data.voter?.has_voted) {
          window.location.assign("/success?already=true");
        } else {
          window.location.assign("/vote");
        }
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      setErrorMessage("Koneksi gagal. Periksa jaringan Anda dan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-batik-subtle">
      {/* Top Header */}
      <header className="py-4 px-4 border-b border-brand-border bg-white/80 backdrop-blur-xs flex items-center justify-center">
        <InstitutionalLogos showTextOnMobile={true} />
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl flex items-center justify-center gap-6 xl:gap-12 relative">
          {/* Mascot Stand (Left flank on desktop) */}
          <div className="hidden lg:flex flex-col items-center justify-end w-48 xl:w-56 shrink-0 pointer-events-none select-none drop-shadow-md transition-transform hover:scale-105 duration-300">
            <div className="relative w-44 xl:w-52 h-64 xl:h-76">
              <Image
                src="/images/maskot-stand.png"
                alt="Maskot Pilkadikip Stand"
                fill
                className="object-contain object-bottom"
                sizes="(max-width: 1280px) 176px, 208px"
                priority
              />
            </div>
            <span className="mt-2 text-[11px] font-bold text-brand-gold uppercase tracking-wider bg-amber-50/80 px-2.5 py-1 rounded-full border border-brand-gold/30">
              #SatuSuaraSatuMasaDepan
            </span>
          </div>

          {/* Main Card */}
          <div className="w-full max-w-md bg-white rounded-2xl border-2 border-brand-border shadow-md overflow-hidden shrink-0 z-10">
            {/* Card Header */}
            <div className="bg-[#FAF8F5] border-b border-brand-border p-6 text-center">
              <div className="relative w-16 h-16 mx-auto mb-3 drop-shadow-xs">
                <Image
                  src="/images/pilkadikip.png"
                  alt="Logo Pilkadikip PNJ 2026"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-brand-gold font-serif font-bold text-xs uppercase tracking-wider mb-2">
                Sistem E-Voting Resmi
              </span>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-brand-dark tracking-tight">
                PILKADIKIP 2026
              </h1>
              <p className="font-serif italic text-brand-gold font-medium text-xs sm:text-sm mt-1">
                &ldquo;Lead With Integrity Grow With Energy&rdquo;
              </p>
            </div>

            {/* Tab Switcher: Voter vs Admin */}
            <div className="grid grid-cols-2 p-1.5 bg-gray-100 border-b border-brand-border text-xs font-bold">
              <button
                id="tab-voter"
                type="button"
                onClick={() => {
                  setIsAdminTab(false);
                  setPassword("");
                  setErrorMessage("");
                }}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  !isAdminTab
                    ? "bg-white text-brand-dark shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Pemilih KIP</span>
              </button>

              <button
                id="tab-admin"
                type="button"
                onClick={() => {
                  setIsAdminTab(true);
                  setPassword("");
                  setErrorMessage("");
                }}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isAdminTab
                    ? "bg-brand-dark text-brand-yellow shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Portal Admin</span>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {!isAdminTab ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Email Mahasiswa PNJ
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="contoh: nama.an23@stu.pnj.ac.id"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-brand-gold focus:ring-2 focus:ring-brand-yellow/50 outline-none text-sm font-sans transition-all text-gray-900 bg-gray-50/50 focus:bg-white"
                      />
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1 block">
                      Gunakan akun yang telah didaftarkan dalam Daftar Pemilih
                      Tetap (DPT).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Kata Sandi (Password)
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        placeholder="masukan kata sandi PILKADIKIP anda"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-brand-gold focus:ring-2 focus:ring-brand-yellow/50 outline-none text-sm font-sans transition-all text-gray-900 bg-gray-50/50 focus:bg-white"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-brand-gold/30 text-xs text-amber-900 mb-3 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>
                      Autentikasi Panitia &amp; Rekapitulasi Suara Pilkadikip
                    </span>
                  </div>

                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Kata Sandi Khusus Admin
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan password admin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-brand-gold focus:ring-2 focus:ring-brand-yellow/50 outline-none text-sm font-sans transition-all text-gray-900 bg-gray-50/50 focus:bg-white"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide text-brand-dark bg-brand-yellow hover:bg-[#E6BC00] active:scale-[0.99] shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isAdminTab
                        ? "Masuk Portal Admin"
                        : "Masuk ke Bilik Suara"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Card Footer Note */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-brand-border text-center text-[11px] text-gray-500">
              Pemilihan langsung, umum, bebas, rahasia, jujur, dan adil.
            </div>
          </div>

          {/* Mascot Sit (Right flank on desktop) */}
          <div className="hidden lg:flex flex-col items-center justify-end w-48 xl:w-56 shrink-0 pointer-events-none select-none drop-shadow-md transition-transform hover:scale-105 duration-300">
            <div className="relative w-44 xl:w-52 h-64 xl:h-76">
              <Image
                src="/images/maskot-sit.png"
                alt="Maskot Pilkadikip Sit"
                fill
                className="object-contain object-bottom"
                sizes="(max-width: 1280px) 176px, 208px"
                priority
              />
            </div>
            <span className="mt-2 text-[11px] font-bold text-brand-gold uppercase tracking-wider bg-amber-50/80 px-2.5 py-1 rounded-full border border-brand-gold/30">
              #IntegritasGenerasiKIP
            </span>
          </div>
        </div>
      </main>

      <InstitutionalFooter />
    </div>
  );
}
