import { petActionRoute } from "@/lib/route-helpers";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return petActionRoute(id, "play");
}
