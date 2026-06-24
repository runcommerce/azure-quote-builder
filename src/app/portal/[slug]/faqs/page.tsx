/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPortal } from "@/lib/db-portals";
import PortalFaqs from "@/components/portal/PortalFaqs";

const fallback = (slug: string): any => ({
  id: "demo", slug, name: slug, company_name: slug,
  primary_color: "#1a3a2e", accent_color: "#c8e63c", welcome_msg: "",
  account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
  account_manager_phone: "01 531 2695", categories: [],
});

export default async function FaqsPage({ params }: { params: { slug: string } }) {
  let portal: any;
  try { portal = await getPortal(params.slug) || fallback(params.slug); }
  catch { portal = fallback(params.slug); }
  return <PortalFaqs portal={portal} />;
}
