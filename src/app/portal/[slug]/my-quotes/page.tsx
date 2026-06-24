/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPortal } from "@/lib/db-portals";
import PortalMyQuotes from "@/components/portal/PortalMyQuotes";

const fallback = (slug: string): any => ({
  id: "demo", slug, name: slug, company_name: slug,
  primary_color: "#183230", accent_color: "#c8e63c", welcome_msg: "",
  account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
  account_manager_phone: "", categories: [],
});

export default async function Page({ params }: { params: { slug: string } }) {
  let portal: any;
  try { portal = await getPortal(params.slug) || fallback(params.slug); }
  catch { portal = fallback(params.slug); }
  return <PortalMyQuotes portal={portal} />;
}
