import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getUserByEmail, bulkInsertCustomers, initDB } from "@/lib/db";

// Seed data — initial customer list provided for pilot phase
const SEED_CUSTOMERS = [
  {
    "name": "Antoanela Sofca",
    "address": "",
    "contact_name": "Antoanela"
  },
  {
    "name": "Sinead Doherty",
    "address": "13 Achill Square Waterville Dublin D15P042",
    "contact_name": "Sinead"
  },
  {
    "name": "3FE Gertrude",
    "address": "130 Pearse St Grand Canal Dock Dublin D02 T322",
    "contact_name": "Becky"
  },
  {
    "name": "Abbott",
    "address": "Lisnamuck Longford",
    "contact_name": "John"
  },
  {
    "name": "ABM",
    "address": "Muirfield Drive Naas Road Dublin 12 D12 N7PV",
    "contact_name": "Beatriz"
  },
  {
    "name": "Accounts Payable",
    "address": "Westmeath County Council, Civic Offices,,Church Street, Athlone, Co Westmeath, N37 P2TS",
    "contact_name": "Pat"
  },
  {
    "name": "Achill Archaeological Field School",
    "address": "Dooagh Achill Island Co. Mayo",
    "contact_name": "Eve"
  },
  {
    "name": "Acquired Brain Injury Ireland",
    "address": "2nd Floor, Block A Century House 100 Upr. Georges Street Dun Laoghaire, Co. Dublin",
    "contact_name": "SarahJane"
  },
  {
    "name": "Action Aid",
    "address": "19 Denzille Lane Dublin 2",
    "contact_name": "Katie"
  },
  {
    "name": "Acupuncture & Traditional Chinese Medicine",
    "address": "Ictcm House Merchants Road Dublin 3",
    "contact_name": "Mary"
  },
  {
    "name": "Adta",
    "address": "4 Church Avenue Mullingar Co.Westmeath",
    "contact_name": "Lorraine"
  },
  {
    "name": "Age Action",
    "address": "30/31 Lower Camden Street Dublin 2 D02 EC96",
    "contact_name": "Thomas"
  },
  {
    "name": "Age Friendly Ireland Shared Service |Meath County Council",
    "address": "Buvinda House, Dublin Road, Navan, Co. Meath, C15 Y291",
    "contact_name": "Rachel"
  },
  {
    "name": "Aid To The Church In Need",
    "address": "151 St Mobhi Road Dublin 1 D09 HC82",
    "contact_name": "Michael"
  },
  {
    "name": "Alexandra Dental",
    "address": "",
    "contact_name": "Conor"
  },
  {
    "name": "Alice Mary Higgins",
    "address": "Leinster House Kildare Street Dublin 2 Attn Of: Ciara Gaynor",
    "contact_name": "Alice Mary"
  },
  {
    "name": "Alice Mary Higgins",
    "address": "Seanad Eireann Kildare Dublin 2",
    "contact_name": "Stephen"
  },
  {
    "name": "All Homes",
    "address": "Unit 70 Western Parkway Business D12 YT62",
    "contact_name": "Paul"
  },
  {
    "name": "All Print Digital",
    "address": "109b Lomond Ave Fairview Dublin D03 CD98",
    "contact_name": "Paul"
  },
  {
    "name": "All Season Flowers",
    "address": "Unit 16, Lucan Shopping Centre, Newcastle Road Lucan Co Dublin K78 VX86",
    "contact_name": "Emily"
  },
  {
    "name": "All Seasons Windows and Doors",
    "address": "Celbridge Co Kildare",
    "contact_name": "Fionnuala"
  },
  {
    "name": "Allen Creative Ltd",
    "address": "26 Avenue Road Portobello Dublin 8 D08 Xt66",
    "contact_name": "Barry"
  },
  {
    "name": "Allianz",
    "address": "Allianz House Elmpark Merrion Rd Dublin 4",
    "contact_name": "Monta"
  },
  {
    "name": "Alone",
    "address": "Olympic House Pleasants Street Dublin 8 D08 H67x",
    "contact_name": "Phillip"
  },
  {
    "name": "Alun Systems Print Ltd",
    "address": "P.O. Box 24 Mallow Cork",
    "contact_name": "Paul"
  },
  {
    "name": "Alzheimer Society Longford Branch",
    "address": "No 1 Church Street Longford",
    "contact_name": "Breda"
  },
  {
    "name": "Alzheimer Society of Ireland",
    "address": "Temple Road Blackrock Co. Dublin",
    "contact_name": "Grace"
  },
  {
    "name": "Alzhimers Society",
    "address": "Earl Street Longford",
    "contact_name": "Eileen"
  },
  {
    "name": "Amazon Security",
    "address": "Hexagon Buildings Snugboro Road Ballycoolen Dulbin 15",
    "contact_name": ""
  },
  {
    "name": "American Well Corporation Ireland Limited",
    "address": "1 Stephen St Upper Dublin 8 D08 DR9P",
    "contact_name": "Marika"
  },
  {
    "name": "Amnesty International Ireland\u200e",
    "address": "Sean McBride House, 48 Fleet St Temple Bar Dublin D02 T883",
    "contact_name": "Jason"
  },
  {
    "name": "An Garda Siochana",
    "address": "Longford N39 Ve84",
    "contact_name": "Ann-marie"
  },
  {
    "name": "Angel Knight",
    "address": "",
    "contact_name": ""
  },
  {
    "name": "Anglo Printers",
    "address": "Mell Industrial Estate DroghedaCo. Louth",
    "contact_name": "Gerard"
  },
  {
    "name": "Anicare Veterinary Facilities",
    "address": "183 Botanic Road Botanic Dublin 9",
    "contact_name": "Kate"
  },
  {
    "name": "Animal Health Ireland",
    "address": "Main Street Carrick On Shannon Co Leitrim",
    "contact_name": "Nuala"
  },
  {
    "name": "AnotherLand creative Studio",
    "address": "",
    "contact_name": "Lauren"
  },
  {
    "name": "Anthony Joyce & Co. Solicitors",
    "address": "SAINT AUGUSTINE HOUSE 42-76 SAINT AUGUSTINE STREET D08 A361",
    "contact_name": "Shauna"
  },
  {
    "name": "Aoife McNamara",
    "address": "Aoife's Cottage Blackabbey Adare Co Limerick V94R85P",
    "contact_name": "Kiara"
  },
  {
    "name": "Ap Wireless",
    "address": "1006 Mile End Mill, Abbey Mill Business Centre, Seedhill Road Paisley Pa1 1js",
    "contact_name": "Kevin"
  },
  {
    "name": "Apogee Corporation Ltd",
    "address": "Nimbus House Liphook Way 20/20 Business Park Maidstone Kent Me16 0fz",
    "contact_name": "Nicolas"
  },
  {
    "name": "Applegreen",
    "address": "Applegreen | Petrogas Group Limited Block 17, Joyce Way, Parkwest Business Park, D12F2V3",
    "contact_name": "Evie"
  },
  {
    "name": "Applus Inspection Services Limited Ireland",
    "address": "3026 Lakedrive Citywest Business Campus Naas Road Dublin 24",
    "contact_name": "Sinead"
  },
  {
    "name": "April Uk",
    "address": "April House, Almondsbury Business Centre Bradley Stoke Bristol Bs32 4qh",
    "contact_name": "Greg"
  },
  {
    "name": "Apwireless Uk Limited",
    "address": "1006 Mile End Mill Abbey Mill Business Centre Seedhill Road Paisley Pa1 1js",
    "contact_name": "Kevin"
  },
  {
    "name": "Aras An Uachtarain",
    "address": "Phoenix Park Castleknock Dublin 8 D08E1W3",
    "contact_name": "Helen"
  },
  {
    "name": "Arc Soloutions",
    "address": "",
    "contact_name": "Carl"
  },
  {
    "name": "Archeng Tech Consulting",
    "address": "Dalton House Bawn Street Strokestown Co Roscommon",
    "contact_name": "Padraig"
  },
  {
    "name": "Argeau",
    "address": "20 Hatch Street Lower Dublin D02 XH02",
    "contact_name": "Diane"
  },
  {
    "name": "Artritis Ireland",
    "address": "1 Clanwilliam Square, Grand Canal Dock, Dublin 2, D02 Dh77",
    "contact_name": "Sophia"
  },
  {
    "name": "Arts Organization",
    "address": "",
    "contact_name": "William"
  },
  {
    "name": "Ashling Hotel",
    "address": "Parkgate Street Dublin 8 D08 P38N",
    "contact_name": "Ciara"
  },
  {
    "name": "Ask Artur",
    "address": "Longford",
    "contact_name": "Artur"
  },
  {
    "name": "Ask Direct",
    "address": "Castleriver House 14-15 Parliament Street Dublin 2",
    "contact_name": "Ashley"
  },
  {
    "name": "Association Of Approved Tourist Guides Of Ireland",
    "address": "57 Farney Park Sandymount Dublin 4",
    "contact_name": "Neal"
  },
  {
    "name": "Asthma Society",
    "address": "",
    "contact_name": "Phaedra Vlahos"
  },
  {
    "name": "Austin Butler Design",
    "address": "Level 3 The Granary 8 Cecilia Street Dublin 2 D02 Rw82",
    "contact_name": "Austin"
  },
  {
    "name": "Autism Assistance Dogs Ireland",
    "address": "UNIT 18A EURO BUSINESS PARK LITTLE ISLAND CO. CORK T45 CR90",
    "contact_name": "Jacob"
  },
  {
    "name": "Autobiz Ltd",
    "address": "Unit 2 Seapoint Barna Galway H91 V6kv",
    "contact_name": "Garry"
  },
  {
    "name": "Autosmart",
    "address": "McCormack Chemicals Gurteenorna Longford",
    "contact_name": "Clive"
  },
  {
    "name": "Avid Energy",
    "address": "Maple House, Potters Bar, Hertfordshire En6 5bs",
    "contact_name": "Niall"
  },
  {
    "name": "Avid Technology International B.V.",
    "address": "Unit 4051 Kingswood Drive Citywest Business Campus Dublin 24",
    "contact_name": "Mark"
  },
  {
    "name": "Axa",
    "address": "Xerox Ibs Limited 2 Little Island Business Park Little Island Co Cork",
    "contact_name": "Robert"
  },
  {
    "name": "Ayu",
    "address": "Clane County Kildare",
    "contact_name": "Zoe"
  },
  {
    "name": "Azure",
    "address": "",
    "contact_name": ""
  },
  {
    "name": "Azure Inhouse Printing",
    "address": "",
    "contact_name": "Jenny"
  },
  {
    "name": "Azure Reprints",
    "address": ", ,",
    "contact_name": ""
  },
  {
    "name": "Azure Sponsored Jobs",
    "address": "3 Damastown Close Damastown Industrial Park Dublin 15 D15 Ek76",
    "contact_name": "Keith"
  }
];

async function requireAdmin(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  let token = await getToken({ req, secret, secureCookie: true }).catch(() => null);
  if (!token) token = await getToken({ req, secret, secureCookie: false }).catch(() => null);
  if (!token?.email) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  let role = "";
  try {
    const u = await getUserByEmail(token.email as string);
    role = u?.role ?? "";
  } catch { /* ignore */ }
  if (!["admin", "superadmin"].includes(role))
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { email: token.email as string };
}

// POST /api/customers/seed — one-time import of the starter customer list.
// Safe to call multiple times — duplicates (matched by name) are skipped.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  try {
    await initDB();
    const result = await bulkInsertCustomers(SEED_CUSTOMERS);
    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      skipped: result.skipped,
      total: SEED_CUSTOMERS.length,
    });
  } catch (err) {
    console.error("POST /api/customers/seed:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
