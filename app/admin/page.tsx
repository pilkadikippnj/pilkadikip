"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InstitutionalLogos } from "@/components/BrandElements";
import { InstitutionalFooter } from "@/components/InstitutionalFooter";
import {
  Users,
  Vote,
  Clock,
  TrendingUp,
  Download,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface StatsData {
  totalDPT: number;
  totalVoted: number;
  totalUnvoted: number;
  turnoutPercent: string;
  votesPaslon1: number;
  votesPaslon2: number;
  percentPaslon1: string;
  percentPaslon2: string;
  totalVotesCounted: number;
}

interface VoterAudit {
  identifier: string;
  has_voted: boolean;
  voted_at: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [voters, setVoters] = useState<VoterAudit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "voted" | "unvoted">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const res = await fetch("/api/admin/stats");
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setStats(data.stats);
          setVoters(data.voters || []);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          router.replace("/login");
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setVoters(data.voters || []);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const exportCSV = () => {
    if (!voters.length) return;
    const headers = "Identifier (Email/NIM),Status Pemilihan,Waktu Memilih\n";
    const rows = voters
      .map(
        (v) =>
          `"${v.identifier}","${v.has_voted ? "SUDAH MEMILIH" : "BELUM MEMILIH"}","${
            v.voted_at ? new Date(v.voted_at).toLocaleString("id-ID") : "-"
          }"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rekapitulasi_pilkadikip_pnj_2026_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVoters = voters.filter((v) => {
    const matchesSearch = v.identifier.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === "voted") return matchesSearch && v.has_voted;
    if (filterStatus === "unvoted") return matchesSearch && !v.has_voted;
    return matchesSearch;
  });

  if (loading || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-canvas">
        <div className="w-10 h-10 border-3 border-brand-gold border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-serif text-sm text-brand-dark">Memverifikasi akses administrator...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-batik-subtle">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-border py-2.5 px-3 sm:px-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <InstitutionalLogos />
            <span className="hidden md:inline-block px-2.5 py-0.5 rounded-md bg-brand-dark text-brand-yellow font-serif font-bold text-xs">
              PANITIA
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={fetchAdminData}
              disabled={refreshing}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-brand-border hover:bg-gray-100 text-xs font-semibold text-gray-700 transition-colors shrink-0"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Segarkan Data</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-red-600 transition-colors shrink-0"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-brand-gold/40 text-brand-dark font-serif font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-brand-gold" />
              <span>Pusat Rekapitulasi &amp; Audit Suara</span>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-brand-dark tracking-tight">
              Dashboard Panitia Pilkadikip 2026
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Pemantauan perolehan suara pasangan calon &amp; partisipasi Daftar Pemilih Tetap (DPT).
            </p>
          </div>

          <button
            onClick={exportCSV}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase text-brand-dark bg-brand-yellow hover:bg-[#E6BC00] shadow-xs transition-all border border-brand-gold/50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Rekap CSV</span>
          </button>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border-2 border-brand-border p-4 shadow-xs">
            <div className="flex items-center justify-between text-gray-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total DPT</span>
              <Users className="w-4 h-4 text-brand-gold" />
            </div>
            <div className="font-serif font-bold text-2xl sm:text-3xl text-brand-dark">
              {stats?.totalDPT.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Mahasiswa KIP Kuliah terdaftar</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-brand-border p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Suara Masuk</span>
              <Vote className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-serif font-bold text-2xl sm:text-3xl text-emerald-700">
              {stats?.totalVoted.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              Tingkat Partisipasi: {stats?.turnoutPercent}%
            </p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-brand-border p-4 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Belum Memilih</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="font-serif font-bold text-2xl sm:text-3xl text-gray-800">
              {stats?.totalUnvoted.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Hak suara belum dipergunakan</p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-brand-border p-4 shadow-xs">
            <div className="flex items-center justify-between text-blue-600 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Kotak Suara</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="font-serif font-bold text-2xl sm:text-3xl text-brand-dark">
              {stats?.totalVotesCounted.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-blue-700 font-semibold mt-1">Verifikasi sah 100%</p>
          </div>
        </div>

        {/* Quick Count Visual Section */}
        <div className="bg-white rounded-2xl border-2 border-brand-border p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-border">
            <div>
              <h3 className="font-serif font-bold text-lg text-brand-dark">
                Perolehan Suara Pasangan Calon (Quick Count)
              </h3>
              <p className="text-xs text-gray-500">
                Akumulasi dari {stats?.totalVotesCounted} total suara sah yang telah masuk.
              </p>
            </div>
            <div className="text-xs font-serif italic text-brand-gold font-bold">
              Real-Time Audit
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paslon 1 Card */}
            <div className="p-5 rounded-xl border-2 border-brand-gold/40 bg-amber-50/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-yellow font-serif font-bold text-brand-dark flex items-center justify-center text-sm shadow-xs border border-brand-gold/40">
                    1
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-gray-900 leading-tight">
                      Try Afandi &amp; Viola Saraswita
                    </h4>
                    <span className="text-[10px] text-brand-gold uppercase font-bold tracking-wider">
                      Paslon Nomor Urut 1
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-serif font-bold text-xl text-brand-dark">
                    {stats?.percentPaslon1}%
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {stats?.votesPaslon1} Suara
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-brand-yellow h-full transition-all duration-500 rounded-full"
                  style={{ width: `${stats?.percentPaslon1 || 0}%` }}
                />
              </div>
            </div>

            {/* Paslon 2 Card */}
            <div className="p-5 rounded-xl border-2 border-brand-gold/40 bg-amber-50/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-yellow font-serif font-bold text-brand-dark flex items-center justify-center text-sm shadow-xs border border-brand-gold/40">
                    2
                  </div>
                  <div>
                    <h4 className="font-sans font-bold text-sm text-gray-900 leading-tight">
                      Fatir Rifai &amp; Nayla Shofwanurrohmah
                    </h4>
                    <span className="text-[10px] text-brand-gold uppercase font-bold tracking-wider">
                      Paslon Nomor Urut 2
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-serif font-bold text-xl text-brand-dark">
                    {stats?.percentPaslon2}%
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {stats?.votesPaslon2} Suara
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-brand-gold h-full transition-all duration-500 rounded-full"
                  style={{ width: `${stats?.percentPaslon2 || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border-2 border-brand-border shadow-xs overflow-hidden">
          <div className="p-5 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-base text-brand-dark">
                Daftar Audit Pemilih ({filteredVoters.length} Data)
              </h3>
              <p className="text-xs text-gray-500">
                Pemeriksaan status hak suara perorangan mahasiswa KIP tanpa mengungkap pilihan (prinsip rahasia).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari email / NIM..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 focus:border-brand-gold focus:ring-2 focus:ring-brand-yellow/50 outline-none text-gray-900"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as "all" | "voted" | "unvoted")}
                className="py-1.5 px-3 text-xs rounded-xl border border-gray-300 text-gray-700 bg-white outline-none focus:border-brand-gold"
              >
                <option value="all">Semua Status</option>
                <option value="voted">Sudah Memilih</option>
                <option value="unvoted">Belum Memilih</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[420px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#FAF8F5] border-b border-brand-border text-gray-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No.</th>
                  <th className="py-3 px-4">Identitas Pemilih (Email Mahasiswa)</th>
                  <th className="py-3 px-4">Status Suara</th>
                  <th className="py-3 px-4">Waktu Partisipasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVoters.slice(0, 100).map((voter, index) => (
                  <tr key={voter.identifier} className="hover:bg-amber-50/30">
                    <td className="py-2.5 px-4 text-gray-400 font-mono">{index + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-medium text-gray-900">
                      {voter.identifier}
                    </td>
                    <td className="py-2.5 px-4">
                      {voter.has_voted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Sudah Memilih
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-semibold">
                          <XCircle className="w-3 h-3 text-gray-400" />
                          Belum Memilih
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-gray-500">
                      {voter.voted_at
                        ? new Date(voter.voted_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVoters.length > 100 && (
            <div className="p-3 bg-gray-50 border-t border-brand-border text-center text-[11px] text-gray-500 font-medium">
              Menampilkan 100 data pertama dari total {filteredVoters.length} pemilih. Unduh rekap CSV untuk melihat keseluruhan baris secara lengkap.
            </div>
          )}
        </div>
      </main>

      <InstitutionalFooter />
    </div>
  );
}
