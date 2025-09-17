'use client'

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('../../components/map/map'), { ssr: false });
// import tipagem do schema
type GeoJSONFeatureCollection = {
    type: "FeatureCollection"
    features: GeoJSONFeature[]
  }

  type GeoJSONFeature = {
    type: "Feature"
    properties: { [key: string]: any }
    geometry: { type: string; coordinates: number[] | number[][] | number[][][] }
  }


export default function ProtectedPage({ acoesProps }: { acoesProps: Record<string, GeoJSONFeatureCollection> }) {
  // const supabase = await createClient();

  // const {
  //   data: { user },
  // } = await supabase.auth.getUser();

  // if (!user) {
  //   return redirect("/sign-in");
  // }

  return (
    <div className="flex-1 w-full flex flex-col ">
     <DynamicMap acoesProps={acoesProps} />
    </div>
  );
}
