import { AdminPanel } from "@/components/admin/adminPanel";

// Força o modo dinâmico para esta página
export const dynamic = 'force-dynamic'

export default function Admin(){
    return (
            <div className="w-full">
                <AdminPanel />
            </div>
    );
}