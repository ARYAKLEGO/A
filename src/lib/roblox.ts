// ---------------------------------------------------------------------------
// Roblox public-API client with CORS-proxy fallback.
// The Roblox REST APIs (users.roblox.com, friends.roblox.com, ...) do not
// send permissive CORS headers, so calls made directly from a browser / APK
// WebView get blocked. We route requests through a small chain of public
// CORS proxies and use whichever responds first.
// ---------------------------------------------------------------------------

export interface RobloxSearchResult {
  id: number;
  name: string;
  displayName: string;
  hasVerifiedBadge: boolean;
  previousUsernames?: string[];
}

export interface RobloxUserDetail {
  id: number;
  name: string;
  displayName: string;
  description: string;
  created: string;
  isBanned: boolean;
  hasVerifiedBadge: boolean;
}

export interface RobloxCounts {
  friends: number | null;
  followers: number | null;
  followings: number | null;
}

export interface FullRobloxProfile {
  user: RobloxUserDetail;
  counts: RobloxCounts;
  avatarUrl: string | null;
}

const PROXIES: Array<(url: string) => string> = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => `https://thingproxy.freeboard.io/fetch/${url}`,
];

let bestProxyIndex = -1; // -1 = try direct first

async function timedFetch(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch JSON from a Roblox public endpoint, trying direct access then a chain of CORS proxies. */
export async function robloxFetch<T>(targetUrl: string): Promise<T> {
  const attempts: Array<() => Promise<Response>> = [];

  if (bestProxyIndex === -1) {
    attempts.push(() => timedFetch(targetUrl, 6000));
  }

  PROXIES.forEach((build, idx) => {
    if (bestProxyIndex === -1 || bestProxyIndex === idx) {
      attempts.push(() => timedFetch(build(targetUrl), 9000));
    }
  });

  // If we already know a good proxy, still keep others as fallback in order.
  if (bestProxyIndex >= 0) {
    PROXIES.forEach((build, idx) => {
      if (idx !== bestProxyIndex) attempts.push(() => timedFetch(build(targetUrl), 9000));
    });
  }

  let lastError: unknown = null;

  for (let i = 0; i < attempts.length; i++) {
    try {
      const res = await attempts[i]();
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      const data = JSON.parse(text) as T;
      // record which strategy worked (skip the "direct" attempt at index recording)
      if (bestProxyIndex === -1 && i > 0) {
        bestProxyIndex = i - 1;
      }
      return data;
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  throw lastError ?? new Error("Semua jalur koneksi gagal");
}

// ---------------------------------------------------------------------------
// Username validation (mirrors Roblox's own rules)
// ---------------------------------------------------------------------------

export interface UsernameRuleCheck {
  id: string;
  label: string;
  passed: boolean;
}

export function getUsernameRuleChecks(username: string): UsernameRuleCheck[] {
  const trimmed = username;
  return [
    {
      id: "length",
      label: "3–20 karakter",
      passed: trimmed.length >= 3 && trimmed.length <= 20,
    },
    {
      id: "chars",
      label: "Hanya huruf, angka, dan underscore (_)",
      passed: /^[A-Za-z0-9_]*$/.test(trimmed) && trimmed.length > 0,
    },
    {
      id: "edges",
      label: "Tidak diawali/diakhiri underscore",
      passed: trimmed.length > 0 && !trimmed.startsWith("_") && !trimmed.endsWith("_"),
    },
    {
      id: "double",
      label: "Tidak ada underscore ganda (__)",
      passed: !trimmed.includes("__"),
    },
    {
      id: "letter",
      label: "Mengandung minimal satu huruf",
      passed: /[A-Za-z]/.test(trimmed),
    },
  ];
}

export function isUsernameFormatValid(username: string): boolean {
  return getUsernameRuleChecks(username).every((r) => r.passed);
}

// ---------------------------------------------------------------------------
// High level lookups
// ---------------------------------------------------------------------------

export async function searchRobloxUsers(keyword: string, limit = 25): Promise<RobloxSearchResult[]> {
  const url = `https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(keyword)}&limit=${limit}`;
  const data = await robloxFetch<{ data: RobloxSearchResult[] }>(url);
  return data.data ?? [];
}

export async function getUserDetail(userId: number): Promise<RobloxUserDetail> {
  const url = `https://users.roblox.com/v1/users/${userId}`;
  return robloxFetch<RobloxUserDetail>(url);
}

export async function getCounts(userId: number): Promise<RobloxCounts> {
  const [friends, followers, followings] = await Promise.allSettled([
    robloxFetch<{ count: number }>(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
    robloxFetch<{ count: number }>(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
    robloxFetch<{ count: number }>(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
  ]);
  return {
    friends: friends.status === "fulfilled" ? friends.value.count : null,
    followers: followers.status === "fulfilled" ? followers.value.count : null,
    followings: followings.status === "fulfilled" ? followings.value.count : null,
  };
}

export async function getAvatarUrl(userId: number): Promise<string | null> {
  try {
    const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`;
    const data = await robloxFetch<{ data: Array<{ imageUrl: string; state: string }> }>(url);
    return data.data?.[0]?.imageUrl ?? null;
  } catch {
    return null;
  }
}

export interface LookupResult {
  status: "available" | "taken";
  exact?: RobloxSearchResult;
  similar: RobloxSearchResult[];
  profile?: FullRobloxProfile;
}

/** Search for an exact (case-insensitive) username match plus similar suggestions. */
export async function lookupUsername(username: string): Promise<LookupResult> {
  const results = await searchRobloxUsers(username, 25);
  const lower = username.toLowerCase();
  const exact = results.find((r) => r.name.toLowerCase() === lower);
  const similar = results.filter((r) => r.name.toLowerCase() !== lower).slice(0, 6);

  if (!exact) {
    return { status: "available", similar };
  }

  const [detail, counts, avatarUrl] = await Promise.all([
    getUserDetail(exact.id),
    getCounts(exact.id),
    getAvatarUrl(exact.id),
  ]);

  return {
    status: "taken",
    exact,
    similar,
    profile: { user: detail, counts, avatarUrl },
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatCount(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}rb`;
  return n.toString();
}

export function formatDateID(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function accountAge(iso: string): string {
  const created = new Date(iso).getTime();
  const now = Date.now();
  let days = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  const years = Math.floor(days / 365);
  days -= years * 365;
  const months = Math.floor(days / 30);
  days -= months * 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (months > 0) parts.push(`${months} bulan`);
  if (years === 0 && months === 0) parts.push(`${days} hari`);
  return parts.join(" ") || "Baru saja";
}
