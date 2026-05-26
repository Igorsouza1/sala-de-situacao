"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeoJSONGeometry } from "./region-geometry-editor";

type Props = {
  value: GeoJSONGeometry | null;
  onChange: (geom: GeoJSONGeometry | null) => void;
};

export const RegionGeometryEditor = dynamic<Props>(
  () => import("./region-geometry-editor").then((mod) => mod.RegionGeometryEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-72 w-full rounded-xl" />,
  }
);
