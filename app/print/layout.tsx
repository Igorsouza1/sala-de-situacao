import { RegionProvider } from "@/context/RegionContext";

export const dynamic = "force-dynamic";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <RegionProvider>{children}</RegionProvider>;
}
