// /api/printlogic/push
// Pushes a quote from Azure IQ into PrintLogic by:
//   1. Authenticating with PrintLogic to get a session cookie
//   2. Looking up the customer_id in PrintLogic by name
//   3. Navigating to that customer to set session context
//   4. POSTing the manual quote form
//   5. Parsing the resulting page to extract the new PrintLogic quote number
//   6. Returning that quote number so we can link it back in Azure IQ

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserByEmail } from "@/lib/db";

const PL_BASE      = "https://www.printlogicsystem.eu";
const PL_LOGIN_URL = "https://www.printlogicsystem.com/p_checkpassword.php";
const PL_USER      = process.env.PRINTLOGIC_USER     ?? "azure_TU";
const PL_PASS      = process.env.PRINTLOGIC_PASSWORD  ?? "4zftvc9336";

// ── Auth helper ─────────────────────────────────────────────────────────────
async function requireSignedIn(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  let token = await getToken({ req, secret, secureCookie: true }).catch(() => null);
  if (!token) token = await getToken({ req, secret, secureCookie: false }).catch(() => null);
  if (!token?.email) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  return { email: token.email as string };
}

// ── PrintLogic session ───────────────────────────────────────────────────────
async function plLogin(): Promise<string | null> {
  // POST login — redirects to the EU domain, returns Set-Cookie
  const res = await fetch(`${PL_LOGIN_URL}?username=${encodeURIComponent(PL_USER)}&password=${encodeURIComponent(PL_PASS)}`, {
    method: "GET",
    redirect: "manual",
    headers: { "User-Agent": "Azure-IQ/1.0" },
  });

  // Collect cookies from redirect chain
  let cookies = res.headers.get("set-cookie") ?? "";

  // Follow the redirect manually to get the session cookie from the EU domain
  const location = res.headers.get("location");
  if (location) {
    const res2 = await fetch(location.startsWith("http") ? location : `${PL_BASE}${location}`, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "Azure-IQ/1.0", Cookie: parseCookieHeader(cookies) },
    });
    const c2 = res2.headers.get("set-cookie");
    if (c2) cookies = cookies ? `${cookies}; ${c2}` : c2;
  }

  return cookies || null;
}

// ── Find PrintLogic customer_id by name ─────────────────────────────────────
async function plFindCustomer(cookieStr: string, name: string): Promise<{ customer_id: string | null; matches: Array<{ id: string; name: string }> }> {
  const url = `${PL_BASE}/p_customer_select.php?search=${encodeURIComponent(name)}`;
  const res = await fetch(url, {
    headers: { Cookie: cookieStr, "User-Agent": "Azure-IQ/1.0" },
  });
  const html = await res.text();

  // Parse customer rows from the table
  // Pattern: <a href="p_customer_index.php?customer_id=XXXXXX">NAME</a>
  const matches: Array<{ id: string; name: string }> = [];
  const re = /p_customer_index\.php\?customer_id=(\d+)[^>]*>([^<]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    matches.push({ id: m[1], name: m[2].trim() });
  }

  // Find best match (case-insensitive exact, then starts-with)
  const lower = name.toLowerCase();
  const exact = matches.find(c => c.name.toLowerCase() === lower);
  const startsWith = matches.find(c => c.name.toLowerCase().startsWith(lower));
  const customer_id = exact?.id ?? startsWith?.id ?? matches[0]?.id ?? null;

  return { customer_id, matches };
}

// ── Navigate to customer page (sets session context in PrintLogic) ───────────
async function plSelectCustomer(cookieStr: string, customer_id: string): Promise<string> {
  const res = await fetch(`${PL_BASE}/p_customer_index.php?customer_id=${customer_id}`, {
    headers: { Cookie: cookieStr, "User-Agent": "Azure-IQ/1.0" },
  });
  // May get updated cookies
  const newCookies = res.headers.get("set-cookie");
  if (newCookies) return mergeCookies(cookieStr, newCookies);
  return cookieStr;
}

// ── POST the manual quote form ───────────────────────────────────────────────
async function plPushQuote(
  cookieStr: string,
  customerId: string,
  quoteData: PLQuoteData
): Promise<{ quote_id: string | null; html: string }> {
  const body = new URLSearchParams();

  // Required hidden fields
  body.set("customer_id", customerId);
  body.set("quote_to", "");
  body.set("quote_id", "0");
  body.set("manual_quote", "true");
  body.set("addingmanual", "");

  // Quote header
  body.set("quote_desc", quoteData.description);
  body.set("quoteref", quoteData.customerRef ?? "");
  body.set("userref", "");  // rep — left as default

  // Hidden item fields (required even if empty)
  for (let i = 1; i <= 10; i++) {
    body.set(`document_id${i}`, "0");
    body.set(`quantity${i}`, "");
    body.set(`qc_fields${i}`, "");
    body.set(`qc_calc_parameters${i}`, "");
    body.set(`pli_id${i}`, "");
    body.set(`pli_pricing${i}`, "");
  }

  // Item details (up to 3 items)
  quoteData.items.forEach((item, idx) => {
    const i = idx + 1;
    body.set(`title${i}`, item.title);
    body.set(`type${i}`, item.type ?? "Print");
    body.set(`vat${i}`, item.vat ?? "23");
    body.set(`desc${i}`, item.detail ?? "");
    body.set(`display${i}`, "on");

    // Quantities and prices (up to 6 quantity tiers)
    item.quantities?.forEach((qty, qi) => {
      body.set(`qty${qi + 1}${i}`, String(qty));
    });
    item.prices?.forEach((price, pi) => {
      body.set(`cost${pi + 1}${i}`, String(price));
    });
  });

  const res = await fetch(`${PL_BASE}/p_pricejob_standard.php`, {
    method: "POST",
    headers: {
      Cookie: cookieStr,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Azure-IQ/1.0",
      "Referer": `${PL_BASE}/p_quote_manual.php?id=0`,
    },
    body: body.toString(),
    redirect: "follow",
  });

  const html = await res.text();

  // Extract the quote_id from the resulting page
  // PrintLogic redirects to p_quote_status.php?quote_id=XXXXXX
  // or shows it in the page as "Quote XXXXXX"
  const urlMatch = res.url.match(/quote_id=(\d+)/);
  const htmlMatch = html.match(/quote_id=(\d+)/);
  const titleMatch = html.match(/QUOTE\s+(\d{6,})/i);

  const quote_id = urlMatch?.[1] ?? htmlMatch?.[1] ?? titleMatch?.[1] ?? null;

  return { quote_id, html: html.substring(0, 2000) };
}

// ── Cookie helpers ───────────────────────────────────────────────────────────
function parseCookieHeader(setCookie: string): string {
  return setCookie
    .split(/,(?=[^ ].*?=)/)
    .map(c => c.split(";")[0].trim())
    .join("; ");
}

function mergeCookies(existing: string, newCookies: string): string {
  const current = new Map(
    existing.split(";").map(c => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
  newCookies.split(/,(?=[^ ].*?=)/).forEach(nc => {
    const part = nc.split(";")[0].trim();
    const [k, ...v] = part.split("=");
    current.set(k, v.join("="));
  });
  const result: string[] = [];
  current.forEach((v, k) => result.push(`${k}=${v}`));
  return result.join("; ");
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface PLQuoteItem {
  title: string;
  detail?: string;
  type?: string;
  vat?: string;
  quantities?: number[];
  prices?: number[];
}

interface PLQuoteData {
  description: string;
  customerRef?: string;
  items: PLQuoteItem[];
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await requireSignedIn(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { customerName, quoteData, azureQuoteId } = body as {
      customerName: string;
      quoteData: PLQuoteData;
      azureQuoteId?: string;
    };

    if (!customerName || !quoteData?.description)
      return NextResponse.json({ error: "customerName and quoteData.description are required" }, { status: 400 });

    console.log(`[PrintLogic] Pushing quote for "${customerName}"...`);

    // 1. Login
    const cookieHeader = await plLogin();
    if (!cookieHeader) {
      return NextResponse.json({ error: "Failed to authenticate with PrintLogic" }, { status: 502 });
    }
    const cookieStr = parseCookieHeader(cookieHeader);
    console.log(`[PrintLogic] Logged in OK`);

    // 2. Find customer
    const { customer_id, matches } = await plFindCustomer(cookieStr, customerName);
    if (!customer_id) {
      return NextResponse.json({
        error: `Customer "${customerName}" not found in PrintLogic`,
        suggestions: matches.slice(0, 5),
      }, { status: 404 });
    }
    console.log(`[PrintLogic] Found customer: ${customer_id} for "${customerName}"`);

    // 3. Select customer (set session context)
    const cookieStr2 = await plSelectCustomer(cookieStr, customer_id);

    // 4. Push quote
    const { quote_id, html } = await plPushQuote(cookieStr2, customer_id, quoteData);

    if (!quote_id) {
      console.error("[PrintLogic] Could not extract quote_id from response:", html.substring(0, 500));
      return NextResponse.json({
        success: false,
        error: "Quote may have been created but could not extract quote number. Check PrintLogic directly.",
        html_preview: html.substring(0, 500),
        customer_id,
      }, { status: 207 });
    }

    const printlogicUrl = `${PL_BASE}/p_quote_status.php?src=2&quote_id=${quote_id}`;
    console.log(`[PrintLogic] Quote created: #${quote_id} → ${printlogicUrl}`);

    return NextResponse.json({
      success: true,
      printlogic_quote_id: quote_id,
      printlogic_customer_id: customer_id,
      printlogic_url: printlogicUrl,
      azure_quote_id: azureQuoteId ?? null,
    });

  } catch (err) {
    console.error("[PrintLogic] push error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
