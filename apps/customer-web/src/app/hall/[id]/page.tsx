import { redirect } from "next/navigation";

/** Keep venue cards on the same storefront and booking contract as every Doorli partner. */
export default async function HallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/shop/${id}`);
}
