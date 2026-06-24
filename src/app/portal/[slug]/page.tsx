/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPortal, getPortalProducts } from "@/lib/db-portals";
import PortalHome from "@/components/portal/PortalHome";

const fallback = (slug: string): any => ({
  id: "demo", slug, name: slug, company_name: slug,
  primary_color: "#183230", accent_color: "#c8e63c",
  welcome_msg: "Welcome to your print & signage portal.",
  account_manager_name: "Lisa Reid", account_manager_email: "lreid@azurecomm.ie",
  account_manager_phone: "01 531 2695", categories: [],
});

export default async function PortalPage({ params }: { params: { slug: string } }) {
  let portal: any, products: any[] = [];
  try {
    portal = await getPortal(params.slug) || fallback(params.slug);
    products = await getPortalProducts(portal.id);
  } catch { portal = fallback(params.slug); }
  return <PortalHome portal={portal} products={products} />;
}
