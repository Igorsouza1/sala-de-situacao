'use client'

import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('../../components/map'), { ssr: false });

export default function ProtectedPage({ regiaoId }: { regiaoId?: number }) {
  return (
    <div className="h-full w-full">
      <DynamicMap regiaoId={regiaoId} />
    </div>
  );
}
