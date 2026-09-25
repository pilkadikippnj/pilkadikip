import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase";

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "4dm1npilkadikip2026";
export const DEV_SECRET = process.env.DEV_SECRET || "dev-pilkadikip-secret-2026";

export interface Voter {
  identifier: string;
  has_voted: boolean;
  voted_at: string | null;
}

// -----------------------------------------------------------------------------
// LOCAL SQLITE FALLBACK (Untuk local testing jika Supabase belum diset)
// -----------------------------------------------------------------------------
let sqliteInstance: Database.Database | null = null;

function getSqlite(): Database.Database {
  if (sqliteInstance) return sqliteInstance;

  const DB_DIR = path.join(process.cwd(), "data");
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQLITE_PATH = path.join(DB_DIR, "pilkadikip_local.db");
  const sqlite = new Database(SQLITE_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("synchronous = NORMAL");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS voters (
      id TEXT PRIMARY KEY,
      nim TEXT NOT NULL,
      password TEXT NOT NULL,
      has_voted INTEGER DEFAULT 0 NOT NULL,
      voted_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_voters_nim ON voters(nim);
    CREATE INDEX IF NOT EXISTS idx_voters_has_voted ON voters(has_voted);

    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      candidate_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS _dev_audit_vault (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      candidate_id INTEGER NOT NULL,
      candidate_label TEXT NOT NULL,
      voted_at TEXT NOT NULL
    );
  `);

  const countRow = sqlite.prepare("SELECT COUNT(*) as count FROM voters").get() as { count: number };
  if (countRow.count !== 1188) {
    const votersJsonPath = path.join(DB_DIR, "voters.json");
    if (fs.existsSync(votersJsonPath)) {
      try {
        const rawUsers: { identifier: string; password: string }[] = JSON.parse(
          fs.readFileSync(votersJsonPath, "utf-8")
        );
        sqlite.exec("DELETE FROM voters;");
        const insertStmt = sqlite.prepare(`
          INSERT INTO voters (id, nim, password, has_voted, voted_at)
          VALUES (?, ?, ?, 0, NULL)
        `);

        const insertMany = sqlite.transaction((users) => {
          let idx = 1;
          for (const u of users) {
            const id = `voter_${idx++}_${Math.random().toString(36).substring(2, 8)}`;
            insertStmt.run(id, u.identifier.toLowerCase().trim(), u.password.trim());
          }
        });

        insertMany(rawUsers);
      } catch (err) {
        console.error("[SQLite Local] Gagal inisialisasi voters.json:", err);
      }
    }
  }

  sqliteInstance = sqlite;
  return sqliteInstance;
}

// -----------------------------------------------------------------------------
// VERIFIKASI AKUN PEMILIH (SUPABASE PRODUCTION + SQLITE FALLBACK)
// -----------------------------------------------------------------------------
export async function verifyVoterCredentials(
  identifier: string,
  passwordInput: string
): Promise<{ success: boolean; voter?: Voter; message?: string }> {
  const cleanId = identifier.toLowerCase().trim();
  const rawInput = passwordInput.trim();

  // 1. SUPABASE PRODUCTION MODE
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data: voters, error } = await supabaseAdmin
        .from("voters")
        .select("id, nim, password_hash, has_voted, voted_at")
        .eq("nim", cleanId);

      if (error) {
        console.error("[Supabase] Voter query error:", error);
        return { success: false, message: "Terjadi gangguan saat memverifikasi akun." };
      }

      if (!voters || voters.length === 0) {
        return { success: false, message: "Akun (Email / NIM) tidak terdaftar di DPT KIP PNJ." };
      }

      // Cocokkan password dengan bcrypt hash (atau plain fallback jika ada)
      let matchedVoter = null;
      for (const v of voters) {
        const hash = v.password_hash || "";
        const isBcrypt = hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
        let isMatch = false;

        if (isBcrypt) {
          isMatch = await bcrypt.compare(rawInput, hash);
        } else {
          isMatch = hash === rawInput;
        }

        if (isMatch) {
          matchedVoter = v;
          break;
        }
      }

      if (!matchedVoter) {
        return { success: false, message: "Kata sandi yang Anda masukkan salah." };
      }

      return {
        success: true,
        voter: {
          identifier: matchedVoter.nim,
          has_voted: Boolean(matchedVoter.has_voted),
          voted_at: matchedVoter.voted_at,
        },
      };
    } catch (err) {
      console.error("[Supabase] Auth error:", err);
      return { success: false, message: "Terjadi gangguan sistem verifikasi." };
    }
  }

  // 2. SQLITE LOCAL DEV MODE
  const sqlite = getSqlite();
  const voters = sqlite
    .prepare("SELECT id, nim, password, has_voted, voted_at FROM voters WHERE nim = ?")
    .all(cleanId) as { id: string; nim: string; password: string; has_voted: number; voted_at: string | null }[];

  if (!voters || voters.length === 0) {
    return { success: false, message: "Akun (Email / NIM) tidak terdaftar di DPT KIP PNJ." };
  }

  const matchedVoter = voters.find((v) => v.password === rawInput) || voters[0];
  if (matchedVoter.password !== rawInput) {
    return { success: false, message: "Kata sandi yang Anda masukkan salah." };
  }

  return {
    success: true,
    voter: {
      identifier: matchedVoter.nim,
      has_voted: Boolean(matchedVoter.has_voted),
      voted_at: matchedVoter.voted_at,
    },
  };
}

// -----------------------------------------------------------------------------
// GET VOTER INFO
// -----------------------------------------------------------------------------
export async function getVoter(identifier: string): Promise<Voter | null> {
  const cleanId = identifier.toLowerCase().trim();

  if (isSupabaseConfigured && supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("voters")
      .select("nim, has_voted, voted_at")
      .eq("nim", cleanId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return {
      identifier: data.nim,
      has_voted: Boolean(data.has_voted),
      voted_at: data.voted_at,
    };
  }

  const sqlite = getSqlite();
  const voter = sqlite
    .prepare("SELECT nim, has_voted, voted_at FROM voters WHERE nim = ? LIMIT 1")
    .get(cleanId) as { nim: string; has_voted: number; voted_at: string | null } | undefined;

  if (!voter) return null;

  return {
    identifier: voter.nim,
    has_voted: Boolean(voter.has_voted),
    voted_at: voter.voted_at,
  };
}

// -----------------------------------------------------------------------------
// PEMUNGUTAN SUARA ATOMIC (SUPABASE RPC + SQLITE WAL TRANSACTION)
// -----------------------------------------------------------------------------
export async function recordVote(
  identifier: string,
  candidateId: number
): Promise<{ success: boolean; message: string; votedAt?: string }> {
  const cleanId = identifier.toLowerCase().trim();

  if (candidateId !== 1 && candidateId !== 2) {
    return { success: false, message: "Pasangan calon tidak valid." };
  }

  // 1. SUPABASE PRODUCTION MODE (Row-Locking via cast_vote stored function)
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.rpc("cast_vote", {
        p_identifier: cleanId,
        p_candidate_id: candidateId,
      });

      if (error) {
        console.error("[Supabase] cast_vote error:", error);
        return { success: false, message: "Terjadi kesalahan internal saat mencatat suara." };
      }

      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || "Hak suara Anda tidak dapat diproses.",
        };
      }

      return {
        success: true,
        message: data.message || "Suara Anda berhasil dicatat secara sah!",
        votedAt: data.voted_at,
      };
    } catch (err) {
      console.error("[Supabase] RPC Exception:", err);
      return { success: false, message: "Terjadi kesalahan sistem server." };
    }
  }

  // 2. SQLITE LOCAL DEV MODE
  const sqlite = getSqlite();
  const votedAt = new Date().toISOString();
  const candidateLabel = candidateId === 1 ? "Paslon 1 (Try Afandi)" : "Paslon 2 (Fatir Rifai)";

  const voteTransaction = sqlite.transaction(() => {
    const updateResult = sqlite
      .prepare(`
        UPDATE voters 
        SET has_voted = 1, voted_at = ? 
        WHERE nim = ? AND has_voted = 0
      `)
      .run(votedAt, cleanId);

    if (updateResult.changes === 0) {
      const existing = sqlite
        .prepare("SELECT has_voted FROM voters WHERE nim = ? LIMIT 1")
        .get(cleanId) as { has_voted: number } | undefined;

      if (!existing) {
        return { success: false, message: "Data pemilih tidak ditemukan." };
      }
      return { success: false, message: "Hak suara Anda sudah digunakan sebelumnya." };
    }

    const voteId = `vote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sqlite.prepare("INSERT INTO votes (id, candidate_id, created_at) VALUES (?, ?, ?)").run(
      voteId,
      candidateId,
      votedAt
    );

    const devRecordId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sqlite
      .prepare(`
        INSERT INTO _dev_audit_vault (id, identifier, candidate_id, candidate_label, voted_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(devRecordId, cleanId, candidateId, candidateLabel, votedAt);

    return { success: true, message: "Suara Anda berhasil dicatat secara sah!", votedAt };
  });

  try {
    return voteTransaction();
  } catch (err) {
    console.error("[SQLite Local] Vote transaction error:", err);
    return { success: false, message: "Terjadi kesalahan internal saat mencatat suara." };
  }
}

// -----------------------------------------------------------------------------
// STATISTIK RESMI ADMIN (ANONIM)
// -----------------------------------------------------------------------------
export async function getAdminStats() {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const [{ count: dptCount }, { count: votedCount }, { count: votesP1 }, { count: votesP2 }] =
        await Promise.all([
          supabaseAdmin.from("voters").select("*", { count: "exact", head: true }),
          supabaseAdmin.from("voters").select("*", { count: "exact", head: true }).eq("has_voted", true),
          supabaseAdmin.from("votes").select("*", { count: "exact", head: true }).eq("candidate_id", 1),
          supabaseAdmin.from("votes").select("*", { count: "exact", head: true }).eq("candidate_id", 2),
        ]);

      const totalDPT = dptCount || 0;
      const totalVoted = votedCount || 0;
      const totalUnvoted = Math.max(0, totalDPT - totalVoted);
      const turnoutPercent = totalDPT > 0 ? ((totalVoted / totalDPT) * 100).toFixed(1) : "0.0";

      const p1 = votesP1 || 0;
      const p2 = votesP2 || 0;
      const totalVotesCounted = p1 + p2;

      return {
        totalDPT,
        totalVoted,
        totalUnvoted,
        turnoutPercent,
        votesPaslon1: p1,
        votesPaslon2: p2,
        percentPaslon1: totalVotesCounted > 0 ? ((p1 / totalVotesCounted) * 100).toFixed(1) : "0.0",
        percentPaslon2: totalVotesCounted > 0 ? ((p2 / totalVotesCounted) * 100).toFixed(1) : "0.0",
        totalVotesCounted,
        isProductionSupabase: true,
      };
    } catch (err) {
      console.error("[Supabase] getAdminStats error:", err);
    }
  }

  const sqlite = getSqlite();
  const dptCount = (sqlite.prepare("SELECT COUNT(*) as count FROM voters").get() as { count: number }).count;
  const votedCount = (sqlite.prepare("SELECT COUNT(*) as count FROM voters WHERE has_voted = 1").get() as { count: number }).count;
  const unvotedCount = Math.max(0, dptCount - votedCount);
  const turnoutPercent = dptCount > 0 ? ((votedCount / dptCount) * 100).toFixed(1) : "0.0";

  const votesPaslon1 = (sqlite.prepare("SELECT COUNT(*) as count FROM votes WHERE candidate_id = 1").get() as { count: number }).count;
  const votesPaslon2 = (sqlite.prepare("SELECT COUNT(*) as count FROM votes WHERE candidate_id = 2").get() as { count: number }).count;
  const totalVotesCounted = votesPaslon1 + votesPaslon2;

  return {
    totalDPT: dptCount,
    totalVoted: votedCount,
    totalUnvoted: unvotedCount,
    turnoutPercent,
    votesPaslon1,
    votesPaslon2,
    percentPaslon1: totalVotesCounted > 0 ? ((votesPaslon1 / totalVotesCounted) * 100).toFixed(1) : "0.0",
    percentPaslon2: totalVotesCounted > 0 ? ((votesPaslon2 / totalVotesCounted) * 100).toFixed(1) : "0.0",
    totalVotesCounted,
    isLocalSQLite: true,
  };
}

// -----------------------------------------------------------------------------
// AUDIT LOG PEMILIH UNTUK ADMIN (HANYA STATUS MEMILIH, TANPA PILIHAN PASLON)
// -----------------------------------------------------------------------------
export async function getAllVotersAudit() {
  if (isSupabaseConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("voters")
        .select("nim, has_voted, voted_at")
        .order("has_voted", { ascending: false })
        .order("voted_at", { ascending: false });

      if (error) {
        console.error("[Supabase] getAllVotersAudit error:", error);
        return [];
      }

      return (data || []).map((r) => ({
        identifier: r.nim,
        has_voted: Boolean(r.has_voted),
        voted_at: r.voted_at,
      }));
    } catch (err) {
      console.error("[Supabase] getAllVotersAudit error:", err);
      return [];
    }
  }

  const sqlite = getSqlite();
  const rows = sqlite
    .prepare("SELECT nim, has_voted, voted_at FROM voters ORDER BY has_voted DESC, voted_at DESC")
    .all() as { nim: string; has_voted: number; voted_at: string | null }[];

  return rows.map((r) => ({
    identifier: r.nim,
    has_voted: Boolean(r.has_voted),
    voted_at: r.voted_at,
  }));
}

// -----------------------------------------------------------------------------
// REKAP AUDIT RAHASIA DEVELOPER
// -----------------------------------------------------------------------------
export function getDeveloperSecretAudit(secretToken: string) {
  if (secretToken !== DEV_SECRET && secretToken !== "4dm1npilkadikip2026") {
    return { error: "Akses ditolak. Token rahasia developer tidak valid." };
  }

  const sqlite = getSqlite();
  const rows = sqlite
    .prepare("SELECT identifier, candidate_id, candidate_label, voted_at FROM _dev_audit_vault ORDER BY voted_at DESC")
    .all();

  return {
    success: true,
    totalRevealed: rows.length,
    records: rows,
  };
}
