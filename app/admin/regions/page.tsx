import Link from "next/link";
import { RegionsAdmin } from "@/components/admin/regions-admin";

export default function RegionsPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <div className="mx-auto max-w-6xl px-6 pb-24">
        <header className="pt-16 pb-10">
          <Link href="/admin" className="text-[14px] text-[#0066cc]">
            &larr; Painel
          </Link>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#1d1d1f]">
            Regiões
          </h1>
          <p className="mt-2 text-[17px] leading-[1.47] text-[#6e6e73]">
            Áreas monitoradas, geometrias e vínculo com organizações.
          </p>
        </header>
        <RegionsAdmin />
      </div>
    </div>
  );
}
