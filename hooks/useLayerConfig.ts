import { useState, useEffect } from 'react';
import { LayerResponseDTO, LayerVisualConfig } from '@/types/map-dto';

const CACHE: Record<string, LayerVisualConfig> = {};

export function useLayerConfig(slug: string, fallback?: LayerVisualConfig, autoFetch = true) {
    const [config, setConfig] = useState<LayerVisualConfig | undefined>(fallback);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!autoFetch || !slug) return;

        // Check Cache
        if (CACHE[slug]) {
            setConfig(CACHE[slug]);
            return;
        }

        let isMounted = true;
        setLoading(true);

        const fetchConfig = async () => {
            try {
                // We fetch all layers because the API currently doesn't support filtering by slug
                // Ideally API should support /api/map/layers?slug=xyz
                // But for now, since this is client-side, we fetch all and find the one we need.
                // Given the number of layers isn't huge, this is acceptable for now.
                const res = await fetch('/api/map/layers');
                if (res.ok) {
                    const layers: LayerResponseDTO[] = await res.json();
                    const targetLayer = layers.find(l => l.slug === slug);

                    if (targetLayer?.visualConfig && isMounted) {
                        CACHE[slug] = targetLayer.visualConfig;
                        setConfig(targetLayer.visualConfig);
                    }
                }
            } catch (e) {
                console.error(`Failed to fetch config for layer: ${slug}`, e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchConfig();

        return () => {
            isMounted = false;
        };
    }, [slug, autoFetch]);

    return { config: config || fallback, loading };
}
