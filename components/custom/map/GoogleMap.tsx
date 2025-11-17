import { useCallback, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
export const stockholmCenterLatLng = {
  lat: 59.3293,
  lng: 18.0686,
};

export interface SchedulePlace {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
  formattedAddress: string;
  placeId: string;
}

declare global {
  interface Window {
    google: any;
  }
}

type GoogleMapsLibraries = {
  GoogleMap: any;
  AdvancedMarkerElement: any;
};

type Position = {
  lat: number;
  lng: number;
};

export default function GoogleMap({
  data,
  zoom = 14,
  center = stockholmCenterLatLng,
}: {
  data: SchedulePlace[];
  zoom?: number;
  center?: { lat: number; lng: number };
}) {
  const MAP_CONFIG = useMemo(
    () => ({
      center: center,
      zoom: zoom,
      mapId: "DEMO_MAP_ID",
    }),
    [zoom, center],
  );

  const mapRef = useRef<HTMLDivElement>(null);

  const loadGoogleMapsAPI = useCallback(async (): Promise<void> => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      throw new Error("API key is not set");
    }

    if (window.google?.maps?.importLibrary) return;

    const script = document.createElement("script");
    script.innerHTML = `
      (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=\`https://maps.\${
        c}apis.com/maps/api/js?\`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})
      ({key: "${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}", v: "weekly"});
    `;
    document.head.appendChild(script);

    // APIが読み込まれるまで待機
    await new Promise<void>((resolve) => {
      const checkGoogle = () => {
        if (window.google?.maps?.importLibrary) {
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };
      checkGoogle();
    });
  }, []);

  const loadMapLibraries =
    useCallback(async (): Promise<GoogleMapsLibraries> => {
      const [{ Map: GoogleMapClass }, { AdvancedMarkerElement }] =
        await Promise.all([
          window.google.maps.importLibrary("maps"),
          window.google.maps.importLibrary("marker"),
        ]);

      return { GoogleMap: GoogleMapClass, AdvancedMarkerElement };
    }, []);

  const createInfoWindowContent = useCallback(
    (item: any, index: number): string => {
      const name = item.name || `Location ${index + 1}`;
      const address = item.formattedAddress
        ? `<p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${item.formattedAddress}</p>`
        : "";

      return `
      <div style="padding: 8px; min-width: 200px; cursor: pointer;" onclick="window.open('${item.link}', '_blank')">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1976d2;">
          ${name}
        </h3>
        ${address}
        <p style="margin: 0; color: #1976d2; font-size: 12px; text-decoration: underline;">
          📍 Google Mapsで開く
        </p>
      </div>
    `;
    },
    [],
  );

  const createMarker = useCallback(
    (
      item: any,
      index: number,
      map: any,
      AdvancedMarkerElement: any,
      infoWindow: any,
    ) => {
      // extractLatLng関数から渡されるLocationPointの場合
      if (item.geometry?.location?.lat && item.geometry?.location?.lng) {
        const position: Position = {
          lat: item.geometry?.location?.lat,
          lng: item.geometry?.location?.lng,
        };

        const marker = new AdvancedMarkerElement({
          map,
          position,
          title: item.name || `Location ${index + 1}`,
        });

        marker.addListener("click", () => {
          const content = createInfoWindowContent(item, index);
          infoWindow.setContent(content);
          infoWindow.open(map, marker);
        });

        return marker;
      }

      // 従来のデータ形式の場合（後方互換性）
      const position: Position = {
        lat: item.geometry?.location?.lat,
        lng: item.geometry?.location?.lng,
      };

      if (!position) {
        console.warn(`No valid position found for item:`, item);
        return null;
      }

      const marker = new AdvancedMarkerElement({
        map,
        position,
        title: item.name || `Location ${index + 1}`,
      });

      marker.addListener("click", () => {
        const content = createInfoWindowContent(item, index);
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      });

      return marker;
    },
    [createInfoWindowContent],
  );

  useEffect(() => {
    const initMap = async (): Promise<void> => {
      if (!mapRef.current) return;

      // マーカーのデータが来るまで待つ
      if (!data || data.length === 0) return;

      try {
        await loadGoogleMapsAPI();
        const { GoogleMap: GoogleMapClass, AdvancedMarkerElement } =
          await loadMapLibraries();

        const map = new GoogleMapClass(mapRef.current, MAP_CONFIG);
        const infoWindow = new window.google.maps.InfoWindow();

        // 地図クリックでInfoWindowを閉じる
        map.addListener("click", () => {
          infoWindow.close();
        });

        // マーカーを作成
        data.forEach((item: any, index: number) => {
          createMarker(item, index, map, AdvancedMarkerElement, infoWindow);
        });
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    };

    initMap();
  }, [loadGoogleMapsAPI, loadMapLibraries, createMarker, data, MAP_CONFIG]);

  return (
    <div
      className={cn(
        "w-full lg:max-w-[55rem] lg:h-[calc(100vh-14.2rem-6.4rem)] z-10",
        (!data || data.length === 0) &&
          "bg-black/10 flex items-center justify-center",
      )}
      ref={mapRef}
    >
      {(!data || data.length === 0) && (
        <p className="text-[1.2rem] text-gray-500">
          No location info to display yet
        </p>
      )}
    </div>
  );
}
