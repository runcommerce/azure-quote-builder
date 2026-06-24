/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPortal, getPortalRequests } from "@/lib/db-portals";
import PortalAdmin from "@/components/portal/PortalAdmin";

const fallback = (slug: string): any => ({
  id: "demo", slug, name: slug, company_name: slug,
  primary_color: "#183230", accent_color: "#c8e63c", welcome_msg: "",
  account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
  account_manager_phone: "", categories: [],
});

export default async function Page({ params }: { params: { slug: string } }) {
  let portal: any, requests: any[] = [];
  try {
    portal = await getPortal(params.slug) || fallback(params.slug);
    if (portal.id !== "demo") requests = await getPortalRequests(portal.id) as any[];
  } catch { portal = fallback(params.slug); }
  return <PortalAdmin portal={portal} requests={requests} />;
}
