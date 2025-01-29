'use client'

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('../../components/map/map'), { ssr: false });

export default function ProtectedPage() {
  // const supabase = await createClient();

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (!user) {
  //   return redirect("/sign-in");
  // }

  return (
    <div className="flex-1 w-full flex flex-col ">
     <DynamicMap />
    </div>
  );
}
