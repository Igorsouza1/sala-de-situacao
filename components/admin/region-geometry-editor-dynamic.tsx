"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

type Position = [number, number];
type Props = {
  value: Position[];
  onChange: (coords: Position[]) => void;
};

// O react-leaflet precisa do "window" pra funcionar, não pode rodar no SSR do next.
export const RegionGeometryEditor = dynamic(
  () => import("./region-geometry-editor").then((mod) => mod.RegionGeometryEditor),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[256px] w-full rounded-xl" /> // alt para 64px (h-64 no tailwind)
  }
);
