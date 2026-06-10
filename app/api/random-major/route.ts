import recommendationData from "@/app/data/recommended-subjects.json";
import { jsonData } from "@/lib/api-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const index = Math.floor(Math.random() * recommendationData.records.length);
  return jsonData(recommendationData.records[index]);
}
