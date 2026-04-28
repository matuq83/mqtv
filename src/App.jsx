import React, { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Search,
  RefreshCw,
  Maximize,
  Home,
  Tv,
  Trophy,
  Newspaper,
  Film,
  Clapperboard,
  Music,
  Baby,
  BookOpen,
  Utensils,
  Theater,
  Star,
  Settings,
  List,
  Grid2x2,
  AlertCircle,
  WifiOff,
  ArrowUp,
  ArrowDown,
  X,
  Clock,
} from "lucide-react";

// ============================================
// 📡 LISTAS M3U (ACTUALIZADAS)
// ============================================
const M3U_SOURCES = [
  // 🎬 CINE Y SERIES COMPLETO (HBO, Cinemax, Warner, etc.)
  { name: "Películas y Series", url: "https://raw.githubusercontent.com/altobelly/iprusia/main/playlist.m3u", country: "LAT", defaultCat: "Cine y Series" },
  
  // 🌎 TODOS LOS CANALES EN ESPAÑOL (incluye cine)
  { name: "Español Latino", url: "https://iptv-org.github.io/iptv/languages/spa.m3u", country: "LAT", defaultCat: "Latinoamérica" },
  
  // ⚽ DEPORTES (ESPN, Fox Sports, TNT Sports)
  { name: "Deportes", url: "https://iptv-org.github.io/iptv/categories/sports.m3u", country: "INT", defaultCat: "Deportes" },
  
  // 🎬 CINE EXCLUSIVO (solo películas 24/7)
  { name: "Cine 24/7", url: "https://iptv-org.github.io/iptv/categories/movies.m3u", country: "INT", defaultCat: "Cine y Series" },
  
  // 📺 SERIES EXCLUSIVO
  { name: "Series", url: "https://iptv-org.github.io/iptv/categories/series.m3u", country: "INT", defaultCat: "Cine y Series" },
  
  // 🇦🇷 ARGENTINA (tus canales locales)
  { name: "Argentina", url: "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ar.m3u", country: "AR", defaultCat: "Canales de aire" },
  
  // El resto de tus listas...
];

// ============================================
// 📺 LISTA DE CANALES PRIORITARIOS (los que pediste)
// ============================================
const PRIORITY_CHANNELS = {
  "Canales de aire": [
    "América TV", "TV Pública", "El Nueve", "Telefe", "El Trece", 
    "Net TV", "Bravo TV", "Telemax", "Canal de la Ciudad"
  ],
  "Regionales": [
    "Canal 10 Córdoba", "Canal 12 Córdoba", "Telefe Córdoba", "Telefe Rosario",
    "Telefe Tucumán", "Canal 7 Mendoza", "Canal 9 Mendoza", "Canal 8 Mar del Plata"
  ],
  "Noticias": [
    "A24", "C5N", "Crónica TV", "TN", "La Nación+", "Canal 26", "IP Noticias",
    "Senado TV", "Canal de la Ciudad", "CNN", "CNN en Español", "Fox News",
    "BBC World News", "DW Español", "France 24", "Al Jazeera", "RT Noticias"
  ],
  "Deportes": [
    "ESPN", "ESPN 2", "ESPN 3", "ESPN 4", "ESPN 5", "ESPN 6", "ESPN 7", "ESPN 8", "ESPN Premium",
    "Fox Sports", "Fox Sports 2", "Fox Sports 3", "TNT Sports", "TNT Sports Premium",
    "TyC Sports", "DirecTV Sports", "DirecTV Sports 2", "DirecTV Sports+",
    "GolTV", "Win Sports", "Claro Sports", "beIN Sports", "NaxSport",
    "DAZN", "FIFA TV", "Fórmula 1 TV", "NBA TV", "NHL Network", "NHL TV",
    "Red Bull TV", "Racing Network", "Sony Sports", "Sport TV",
    "FC Barcelona TV", "Real Madrid TV"
  ],
  "Cine y Series": [
    "HBO", "HBO 2", "HBO Plus", "HBO Family", "HBO Signature", "HBO Mundi", "HBO Pop",
    "Cinemax", "Cinemax Action", "Cinemax Hits", "Cinecanal", "TNT", "Space",
    "FX", "FX Movies", "Sony Movies", "AXN Movies", "Paramount Network",
    "Studio Universal", "Universal Cinema", "Golden", "Golden Plus", "AMC",
    "Europa Europa", "Film&Arts", "Warner Channel", "Sony Channel",
    "AXN", "Star Channel", "TNT Series"
  ],
  "Música": [
    "MTV", "MTV Hits", "MTV Live", "VH1", "HTV"
  ],
  "Infantil": [
    "Disney Channel", "Disney Junior", "Disney XD", "Cartoon Network",
    "Nickelodeon", "Nick Jr", "Discovery Kids", "Paka Paka"
  ],
  "Documentales": [
    "Discovery Channel", "Discovery Science", "Animal Planet", "NatGeo",
    "NatGeo Wild", "History", "History 2"
  ],
  "Estilo de vida": [
    "El Gourmet", "Food Network", "TLC", "Home & Health"
  ],
  "Variedades": [
    "Net TV", "Bravo TV", "Telemax", "Canal de la Ciudad", "Senado TV"
  ]
};

// Todas las categorías en el ORDEN exacto (CINE Y SERIES JUNTOS)
const MAIN_CATEGORIES = [
  "Todos los canales",
  "Canales de aire",
  "Regionales",
  "Noticias",
  "Deportes",
  "Cine y Series",  // ← ¡Aquí están tus canales de cine!
  "Música",
  "Infantil",
  "Documentales",
  "Estilo de vida",
  "Variedades",
];

// ============================================
// 🧠 FUNCIONES DE UTILIDAD
// ============================================
function getArgentinaTime() {
  return new Date().toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getArgentinaDate() {
  return new Date().toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// ============================================
// 🧠 PARSEAR M3U
// ============================================
function parseM3U(content, sourceName, sourceCountry, defaultCategory) {
  const lines = content.split("\n");
  const channels = [];
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#EXTINF")) {
      const nameMatch = trimmed.match(/,([^,]+)$/);
      let name = nameMatch ? nameMatch[1].trim() : "";
      name = name.replace(/\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "").trim();
      if (!name || name.length < 2) continue;

      const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/i);
      
      // Determinar categoría según lista prioritaria
      let category = defaultCategory;
      for (const [catName, channelsList] of Object.entries(PRIORITY_CHANNELS)) {
        if (channelsList.some(c => name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(name.toLowerCase()))) {
          category = catName;
          break;
        }
      }

      current = {
        id: `${sourceName}-${Math.random().toString(36).substring(2, 6)}`,
        name: name,
        logoUrl: logoMatch?.[1] || "",
        category: category,
        country: sourceCountry,
        badge: sourceCountry,
        streamUrl: null,
      };
    } 
    else if (!trimmed.startsWith("#") && current) {
      if (trimmed.startsWith("http") && (trimmed.includes(".m3u8") || trimmed.includes(".mp4") || trimmed.includes(".ts"))) {
        current.streamUrl = trimmed;
        channels.push({ ...current });
      }
      current = null;
    }
  }
  
  return channels;
}

// ============================================
// 📡 CARGAR TODAS LAS LISTAS M3U
// ============================================
async function loadAllM3UChannels() {
  console.log("🌐 Cargando listas M3U desde IPTV-org...");
  const allChannels = [];
  const seenNames = new Set();
  
  for (const source of M3U_SOURCES) {
    try {
      console.log(`  Cargando ${source.name}...`);
      const response = await fetch(source.url);
      if (!response.ok) {
        console.warn(`  ✗ Error ${source.name}: HTTP ${response.status}`);
        continue;
      }
      const text = await response.text();
      const channels = parseM3U(text, source.name, source.country, source.defaultCat);
      
      for (const channel of channels) {
        if (!seenNames.has(channel.name)) {
          seenNames.add(channel.name);
          allChannels.push(channel);
        }
      }
      console.log(`  ✓ ${source.name}: ${channels.length} canales`);
    } catch (error) {
      console.warn(`  ✗ Error en ${source.name}:`, error.message);
    }
  }
  
  // Ordenar según prioridad
  const orderedChannels = [];
  for (const [category, channelNames] of Object.entries(PRIORITY_CHANNELS)) {
    for (const channelName of channelNames) {
      const found = allChannels.find(c => 
        c.name.toLowerCase().includes(channelName.toLowerCase()) || 
        channelName.toLowerCase().includes(c.name.toLowerCase())
      );
      if (found && !orderedChannels.includes(found)) {
        orderedChannels.push(found);
      }
    }
  }
  
  // Agregar el resto
  for (const channel of allChannels) {
    if (!orderedChannels.includes(channel)) {
      orderedChannels.push(channel);
    }
  }
  
  console.log(`✅ Total: ${orderedChannels.length} canales únicos`);
  return orderedChannels;
}

// ============================================
// 🎬 COMPONENTE PRINCIPAL
// ============================================
export default function App() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos los canales");
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Cargando canales...");
  const [streamError, setStreamError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChannelSelector, setShowChannelSelector] = useState(false);
  const [toastChannel, setToastChannel] = useState(null);
  const [currentTime, setCurrentTime] = useState(getArgentinaTime());
  const [currentDate, setCurrentDate] = useState(getArgentinaDate());
  const videoContainerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Reloj argentino
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getArgentinaTime());
      setCurrentDate(getArgentinaDate());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar canales desde M3U
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadingMessage("Conectando con IPTV-org...");
      const loadedChannels = await loadAllM3UChannels();
      setChannels(loadedChannels);
      if (loadedChannels.length > 0) {
        setSelectedChannel(loadedChannels[0]);
        setLoadingMessage(`${loadedChannels.length} canales cargados`);
      } else {
        setLoadingMessage("No se encontraron canales");
      }
      setLoading(false);
    };
    load();
  }, []);

  // Mostrar zócalo al cambiar canal
  const showChannelToast = (channel) => {
    setToastChannel(channel);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastChannel(null);
    }, 3000);
  };

  // Reproductor
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedChannel?.streamUrl) {
      if (selectedChannel) setStreamError("Stream no disponible");
      return;
    }

    setStreamError(null);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const play = () => {
      try {
        video.pause();
        video.removeAttribute("src");
        video.load();
        const url = selectedChannel.streamUrl;
        console.log(`🎬 Reproduciendo: ${selectedChannel.name} - ${url.substring(0, 80)}`);

        if (Hls.isSupported() && url.includes(".m3u8")) {
          const hls = new Hls({ 
            enableWorker: true, 
            lowLatencyMode: true,
            maxBufferLength: 30,
          });
          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => setStreamError("Haz clic en el video para reproducir"));
          });
          
          hls.on(Hls.Events.ERROR, (_, data) => {
            console.error("HLS Error:", data);
            if (data.fatal) {
              setStreamError("Señal no disponible momentáneamente");
            }
          });
        } else {
          video.src = url;
          video.play().catch(() => setStreamError("Haz clic para reproducir"));
        }
      } catch (err) {
        console.error("Error:", err);
        setStreamError("Error al reproducir");
      }
    };
    play();
    
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedChannel]);

  // Filtrar canales
  const filtered = useMemo(() => {
    let results = channels;
    if (selectedCategory !== "Todos los canales") {
      results = results.filter(c => c.category === selectedCategory);
    }
    if (query) {
      results = results.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
    }
    return results;
  }, [channels, query, selectedCategory]);

  // Cambiar canal
  const changeChannel = (direction) => {
    const currentIndex = filtered.findIndex(c => c.id === selectedChannel?.id);
    let newIndex;
    if (direction === "up") {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
    } else {
      newIndex = currentIndex < filtered.length - 1 ? currentIndex + 1 : 0;
    }
    if (filtered[newIndex]) {
      const newChannel = filtered[newIndex];
      setSelectedChannel(newChannel);
      setStreamError(null);
      if (isFullscreen) {
        showChannelToast(newChannel);
      }
    }
  };

  // Teclado en fullscreen
  useEffect(() => {
    const handleKey = (e) => {
      if (!isFullscreen) return;
      if (e.key === "ArrowUp") { e.preventDefault(); changeChannel("up"); }
      else if (e.key === "ArrowDown") { e.preventDefault(); changeChannel("down"); }
      else if (e.key === "Escape") { exitFullscreen(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isFullscreen, selectedChannel, filtered]);

  // Fullscreen handlers
  const enterFullscreen = () => {
    const elem = videoContainerRef.current;
    if (elem?.requestFullscreen) {
      elem.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
      setShowChannelSelector(false);
      setToastChannel(null);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs) {
        setShowChannelSelector(false);
        setToastChannel(null);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06101d] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white/80">{loadingMessage}</p>
          <p className="text-xs text-slate-500 mt-2">Descargando listas de canales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#06101d] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col bg-[radial-gradient(circle_at_top,_rgba(246,165,49,0.08),_transparent_20%)]">
        
        {/* Header con logo más grande */}
        <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo3.png" 
              alt="MQ TV" 
              className="h-16 w-auto object-contain" 
              onError={(e) => { e.currentTarget.src = "https://placehold.co/200x80/1e293b/orange?text=MQ+TV"; }} 
            />
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">{channels.length} canales</span>
          </div>
          <div className="flex flex-1 flex-col gap-3 lg:max-w-2xl lg:flex-row lg:items-center lg:justify-end">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 lg:max-w-md">
              <Search className="h-5 w-5 text-slate-400" />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Buscar canal..." 
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
            <button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition hover:bg-white/10">
              <RefreshCw className="h-4 w-4" /> Actualizar
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - CATEGORÍAS EN ORDEN EXACTO */}
          <aside className="hidden w-64 flex-col border-r border-white/10 bg-white/5 p-4 md:flex overflow-y-auto">
            <div className="mb-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Categorías</h3>
              <div className="space-y-1">
                {MAIN_CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${selectedCategory === cat ? "bg-[#f6a531] text-slate-950" : "hover:bg-white/5 text-slate-300"}`}>
                    {cat === "Canales de aire" && <Tv className="h-4 w-4" />}
                    {cat === "Regionales" && <Home className="h-4 w-4" />}
                    {cat === "Noticias" && <Newspaper className="h-4 w-4" />}
                    {cat === "Deportes" && <Trophy className="h-4 w-4" />}
                    {cat === "Cine y Series" && <Film className="h-4 w-4" />}
                    {cat === "Música" && <Music className="h-4 w-4" />}
                    {cat === "Infantil" && <Baby className="h-4 w-4" />}
                    {cat === "Documentales" && <BookOpen className="h-4 w-4" />}
                    {cat === "Estilo de vida" && <Utensils className="h-4 w-4" />}
                    {cat === "Variedades" && <Theater className="h-4 w-4" />}
                    {cat === "Todos los canales" && <Grid2x2 className="h-4 w-4" />}
                    <span className="text-sm">{cat}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Menú adicional */}
            <div className="border-t border-white/10 pt-4 mt-2">
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5 text-slate-300">
                <Star className="h-4 w-4" /> <span className="text-sm">Favoritos</span>
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5 text-slate-300">
                <Settings className="h-4 w-4" /> <span className="text-sm">Configuración</span>
              </button>
            </div>
            
            <div className="mt-auto rounded-xl border border-white/10 bg-[#0f1d30] p-3 mt-4">
              <p className="text-xs text-slate-400">{filtered.length} canales disponibles</p>
              <p className="mt-1 text-[10px] text-slate-500">MQ TV • En vivo</p>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {selectedChannel && (
              <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                <div ref={videoContainerRef} className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/50">
                  <video 
                    ref={videoRef} 
                    controls={!isFullscreen} 
                    autoPlay 
                    playsInline 
                    className="aspect-video w-full object-contain"
                    controlsList="nodownload"
                  />
                </div>
                <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> EN VIVO
                    </div>
                    <h2 className="text-xl font-bold">{selectedChannel.name}</h2>
                    <p className="text-sm text-slate-400">{selectedChannel.category}</p>
                  </div>
                  <div className="mt-4">
                    <button onClick={enterFullscreen} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#f6a531] py-2.5 font-bold text-slate-950 transition hover:brightness-110">
                      <Maximize className="h-4 w-4" /> Pantalla completa
                    </button>
                  </div>
                </div>
              </div>
            )}

            {streamError && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/20 px-4 py-2 text-sm text-red-300">
                <AlertCircle className="h-4 w-4" /> {streamError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filtered.slice(0, 200).map((channel) => (
                <button 
                  key={channel.id} 
                  onClick={() => { 
                    setSelectedChannel(channel); 
                    if (isFullscreen) showChannelToast(channel);
                  }} 
                  className={`group rounded-xl border p-3 text-left transition ${selectedChannel?.id === channel.id ? "border-orange-400/60 bg-[#13243a]" : "border-white/10 bg-[#0f1d30] hover:border-white/20 hover:bg-[#13243a]"}`}
                >
                  <div className="flex items-center gap-2">
                    {channel.logoUrl ? (
                      <img src={channel.logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain bg-white/10 p-1" onError={(e) => e.currentTarget.style.display = "none"} />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-xs font-bold">
                        {channel.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{channel.name}</div>
                      <div className="text-[10px] text-slate-400">{channel.category}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <WifiOff className="h-12 w-12 text-slate-500 mb-4" />
                <p className="text-slate-400">No se encontraron canales</p>
                <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm">
                  Reintentar
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Mobile nav */}
        <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-white/10 bg-[#081320]/95 px-4 py-3 backdrop-blur md:hidden">
          <button onClick={() => setSelectedCategory("Canales de aire")} className="flex flex-col items-center gap-1 text-xs text-white">
            <Tv className="h-5 w-5" /><span>Canales</span>
          </button>
          <button onClick={() => setSelectedCategory("Noticias")} className="flex flex-col items-center gap-1 text-xs text-white">
            <Newspaper className="h-5 w-5" /><span>Noticias</span>
          </button>
          <button onClick={() => setSelectedCategory("Deportes")} className="flex flex-col items-center gap-1 text-xs text-white">
            <Trophy className="h-5 w-5" /><span>Deportes</span>
          </button>
          <button onClick={() => setSelectedCategory("Cine y Series")} className="flex flex-col items-center gap-1 text-xs text-white">
            <Film className="h-5 w-5" /><span>Cine</span>
          </button>
        </nav>
      </div>

      {/* ========================================== */}
      {/* ZÓCALO EN FULLSCREEN */}
      {/* ========================================== */}
      {isFullscreen && toastChannel && (
        <div className="fixed bottom-28 left-1/2 z-[9999] -translate-x-1/2" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          <div className="flex items-center gap-4 rounded-2xl bg-black/95 backdrop-blur-xl px-5 py-3 border-l-4 border-[#f6a531] shadow-2xl min-w-[340px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-500/30 text-xl font-bold">
              {toastChannel.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-red-400">● EN VIVO</span>
                <span className="text-xs text-slate-400">{toastChannel.category}</span>
              </div>
              <div className="text-lg font-bold text-white">{toastChannel.name}</div>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-1">
                <Clock className="h-3 w-3" />
                <span>{currentDate} • {currentTime} (Argentina)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen channel selector */}
      {isFullscreen && showChannelSelector && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-black/90 backdrop-blur-lg border-l border-white/20 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Cambiar canal</h3>
            <button onClick={() => setShowChannelSelector(false)} className="p-1 hover:bg-white/10 rounded-lg"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-2">
            {filtered.map((channel) => (
              <button key={channel.id} onClick={() => { setSelectedChannel(channel); setShowChannelSelector(false); showChannelToast(channel); }} className={`w-full text-left p-3 rounded-xl transition ${selectedChannel?.id === channel.id ? "bg-orange-500/20 border border-orange-500/50" : "hover:bg-white/10"}`}>
                <div className="font-medium">{channel.name}</div>
                <div className="text-xs text-slate-400">{channel.category}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen controls */}
      {isFullscreen && !showChannelSelector && (
        <>
          <div className="fixed bottom-20 right-4 z-50 cursor-pointer" onClick={() => setShowChannelSelector(true)}>
            <div className="bg-black/70 backdrop-blur rounded-full p-3 border border-white/20"><List className="h-6 w-6" /></div>
          </div>
          <div className="fixed left-1/2 bottom-8 z-50 -translate-x-1/2 flex gap-4 rounded-full bg-black/70 backdrop-blur-lg px-4 py-2 border border-white/20">
            <button onClick={() => changeChannel("up")} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowUp className="h-6 w-6" /></button>
            <button onClick={() => changeChannel("down")} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowDown className="h-6 w-6" /></button>
            <button onClick={exitFullscreen} className="p-2 hover:bg-white/10 rounded-full transition"><X className="h-6 w-6" /></button>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
}