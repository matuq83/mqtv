import React, { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Search,
  RefreshCw,
  Play,
  Volume2,
  Maximize,
  Home,
  Tv,
  Trophy,
  Newspaper,
  Film,
  Clapperboard,
  Music,
  Baby,
  List,
  Grid2x2,
  Star,
  Info,
  MonitorPlay,
} from "lucide-react";

// 👈 NUEVO: Definir ambas URLs
const M3U_URL_ARGENTINA = "https://raw.githubusercontent.com/iptv-org/iptv/master/streams/ar.m3u";
const M3U_URL_PELIS = "https://raw.githubusercontent.com/dmelendez11/lista-canales-m3u/main/canales.m3u";

function parseM3U(content) {
  const lines = content.split("\n");
  const channels = [];
  let current = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("#EXTINF")) {
      const name = line.split(",").pop()?.trim() || "Canal";

      const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
      const groupMatch = line.match(/group-title="([^"]+)"/i);

      current = {
        id: Math.random().toString(36).substring(2, 10),
        name,
        groupTitle: groupMatch?.[1] || "",
        logoUrl: logoMatch?.[1] || "",
        category: categorizeChannel(name, groupMatch?.[1] || ""),
        current: "En vivo",
        next: "Programación",
        time: "Ahora",
        nextTime: "Luego",
        badge: "AR",
        streamUrl: "",
      };
    } else if (!line.startsWith("#") && current) {
      current.streamUrl = line;
      channels.push(current);
      current = null;
    }
  }

  return channels;
}

function categorizeChannel(name, group = "") {
  const text = `${name} ${group}`.toLowerCase();

  // Canales de aire
  if (
    text.includes("telefe") ||
    text.includes("américa tv") ||
    text.includes("america tv") ||
    text.includes("el trece") ||
    text.includes("eltrece") ||
    text.includes("el nueve") ||
    text.includes("elnueve") ||
    text.includes("tv pública") ||
    text.includes("tv publica") ||
    text.includes("televisión pública") ||
    text.includes("television publica")
  ) {
    return "Canales de aire";
  }

  // Noticias
  if (
    text.includes("ln+") ||
    text.includes("la nación+") ||
    text.includes("la nacion+") ||
    text.includes("tn") ||
    text.includes("a24") ||
    text.includes("c5n") ||
    text.includes("crónica") ||
    text.includes("cronica") ||
    text.includes("canal e") ||
    text.includes("ip noticias") ||
    text.includes("ip ") ||
    text.includes("noticias") ||
    text.includes("news")
  ) {
    return "Noticias";
  }

  // Deportes
  if (
    text.includes("tyc") ||
    text.includes("deport") ||
    text.includes("sports") ||
    text.includes("fútbol") ||
    text.includes("futbol")
  ) {
    return "Deportes";
  }

  // Películas
  if (
    text.includes("cine") ||
    text.includes("movie") ||
    text.includes("film") ||
    text.includes("volver") ||
    text.includes("hbo") ||
    text.includes("cinemax") ||
    text.includes("sony") ||
    text.includes("warner") ||
    text.includes("pelis")
  ) {
    return "Películas";
  }

  // Series
  if (
    text.includes("serie") ||
    text.includes("fox") ||
    text.includes("universal") ||
    text.includes("tnt")
  ) {
    return "Series";
  }

  // Infantil
  if (
    text.includes("kids") ||
    text.includes("junior") ||
    text.includes("pakapaka") ||
    text.includes("disney")
  ) {
    return "Infantil";
  }

  // Música
  if (
    text.includes("music") ||
    text.includes("música") ||
    text.includes("musica") ||
    text.includes("quiero") ||
    text.includes("beats") ||
    text.includes("mtv")
  ) {
    return "Música";
  }

  // Documentales
  if (
    text.includes("docu") ||
    text.includes("discovery") ||
    text.includes("national geographic") ||
    text.includes("history") ||
    text.includes("nat geo")
  ) {
    return "Documentales";
  }

  // Regionales
  if (
    text.includes("canal 2") ||
    text.includes("canal 3") ||
    text.includes("canal 4") ||
    text.includes("canal 5") ||
    text.includes("canal 6") ||
    text.includes("canal 7") ||
    text.includes("canal 8") ||
    text.includes("misiones") ||
    text.includes("ushuaia") ||
    text.includes("corrientes") ||
    text.includes("jujuy") ||
    text.includes("santa fe") ||
    text.includes("la pampa") ||
    text.includes("san juan") ||
    text.includes("posadas") ||
    text.includes("regional")
  ) {
    return "Regionales";
  }

  return "Entretenimiento";
}

function categoryIcon(cat) {
  switch (cat) {
    case "Noticias":
      return <Newspaper className="h-4 w-4" />;
    case "Deportes":
      return <Trophy className="h-4 w-4" />;
    case "Películas":
      return <Film className="h-4 w-4" />;
    case "Series":
      return <Clapperboard className="h-4 w-4" />;
    case "Música":
      return <Music className="h-4 w-4" />;
    case "Infantil":
      return <Baby className="h-4 w-4" />;
    case "Documentales":
      return <Info className="h-4 w-4" />;
    default:
      return <Tv className="h-4 w-4" />;
  }
}

function initials(text) {
  return text
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function colorFromName(name) {
  const palette = [
    "from-cyan-400 to-blue-500",
    "from-orange-400 to-amber-500",
    "from-fuchsia-400 to-purple-500",
    "from-emerald-400 to-teal-500",
    "from-red-400 to-rose-500",
    "from-indigo-300 to-sky-500",
  ];
  return palette[name.length % palette.length];
}

function Logo({ channel }) {
  if (channel.logoUrl) {
    return (
      <img
        src={channel.logoUrl}
        alt={channel.name}
        className="h-11 w-11 rounded-xl object-contain bg-white/5 p-1"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${colorFromName(
        channel.name
      )} text-sm font-black text-white shadow-lg`}
    >
      {initials(channel.name)}
    </div>
  );
}

export default function App() {
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("Todos los canales");
  const [loading, setLoading] = useState(false);
  const [sourceStatus, setSourceStatus] = useState("Cargando canales...");
  const videoRef = useRef(null);

  // 👈 useEffect modificado para cargar ambas listas
  useEffect(() => {
    const loadChannels = async () => {
      setLoading(true);
      try {
        const [resArgentina, resPelis] = await Promise.all([
          fetch(M3U_URL_ARGENTINA),
          fetch(M3U_URL_PELIS)
        ]);

        const textArgentina = await resArgentina.text();
        const textPelis = await resPelis.text();

        const canalesArgentina = parseM3U(textArgentina);
        const canalesPelis = parseM3U(textPelis);

        const canalesCombinados = [...canalesArgentina, ...canalesPelis];

        setChannels(canalesCombinados);
        setSelectedChannel(canalesCombinados[0] || null);
        setSourceStatus(`${canalesCombinados.length} canales cargados (${canalesArgentina.length} AR + ${canalesPelis.length} Pelis/Series)`);
      } catch (error) {
        console.error("Error cargando listas M3U:", error);
        setSourceStatus("No se pudieron cargar las listas.");
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, []);

  // El resto del código (useEffect del video, useMemo, return) se mantiene IGUAL
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !selectedChannel?.streamUrl) return;

    let hls;

    try {
      video.pause();
      video.removeAttribute("src");
      video.load();

      const url = selectedChannel.streamUrl;

      if (Hls.isSupported() && url.toLowerCase().includes(".m3u8")) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.play().catch(() => {});
      } else {
        video.src = url;
        video.play().catch(() => {});
      }
    } catch (err) {
      console.error("Error reproduciendo canal:", err);
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [selectedChannel]);

  const categories = useMemo(() => {
    const base = [
      "Todos los canales",
      "Canales de aire",
      "Noticias",
      "Deportes",
      "Entretenimiento",
      "Películas",
      "Series",
      "Documentales",
      "Música",
      "Infantil",
      "Regionales",
    ];

    const dynamic = Array.from(new Set(channels.map((c) => c.category)));
    return Array.from(new Set([...base, ...dynamic]));
  }, [channels]);

  const filtered = useMemo(() => {
    return channels.filter((channel) => {
      const matchCategory =
        selectedCategory === "Todos los canales" ||
        channel.category === selectedCategory;

      const text =
        `${channel.name} ${channel.category} ${channel.groupTitle}`.toLowerCase();
      const matchQuery = text.includes(query.toLowerCase());

      return matchCategory && matchQuery;
    });
  }, [channels, query, selectedCategory]);

  const featured = selectedChannel || filtered[0] || null;

  const agenda = useMemo(() => {
    return channels.filter((c) => c.category === "Deportes").slice(0, 4);
  }, [channels]);

  const sideSections = [
    { label: "Inicio", key: "Todos los canales", icon: <Home className="h-5 w-5" /> },
    { label: "Canales", key: "Entretenimiento", icon: <Tv className="h-5 w-5" /> },
    { label: "Deportes", key: "Deportes", icon: <Trophy className="h-5 w-5" /> },
    { label: "Noticias", key: "Noticias", icon: <Newspaper className="h-5 w-5" /> },
    { label: "Favoritos", key: "Todos los canales", icon: <Star className="h-5 w-5" /> },
  ];

  return (
    <div className="min-h-screen w-full bg-[#06101d] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col bg-[radial-gradient(circle_at_top,_rgba(246,165,49,0.08),_transparent_20%),linear-gradient(180deg,#07111f_0%,#081425_45%,#06101d_100%)]">
        <header className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2 backdrop-blur-md border border-white/10">
            <img
              src="/logo.png"
              alt="MQTV"
              className="h-12 w-auto object-contain rounded-lg"
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:max-w-3xl lg:flex-row lg:items-center lg:justify-end">
            <div className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 lg:max-w-xl">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar canal..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-28 flex-col border-r border-white/10 bg-white/5 p-3 md:flex">
            <div className="space-y-2">
              {sideSections.map((item) => {
                const active = selectedCategory === item.key;
                return (
                  <button
                    key={item.label}
                    onClick={() => setSelectedCategory(item.key)}
                    className={`flex w-full flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center transition ${
                      active
                        ? "bg-[#f6a531] text-slate-950 shadow-lg shadow-orange-500/20"
                        : "bg-transparent text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    {item.icon}
                    <span className="text-xs font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-auto rounded-2xl border border-white/10 bg-[#0f1d30] p-3 text-xs text-slate-400">
              <p className="mb-2 font-semibold text-white">Estado</p>
              <p>{sourceStatus}</p>
            </div>
          </aside>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            <section className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
              <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#10233a_0%,#0b1627_60%,#07111f_100%)] shadow-2xl">
                <div className="relative min-h-[320px] p-5 md:p-6">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(246,165,49,0.20),transparent_25%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.16),transparent_22%)]" />
                  <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300 ring-1 ring-red-400/20">
                          <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                          EN VIVO
                        </div>
                        <h2 className="max-w-2xl text-3xl font-black leading-tight md:text-4xl">
                          {featured?.name || "Sin señal seleccionada"}
                        </h2>
                        <p className="mt-2 text-lg text-slate-300">
                          {featured?.category || "TV"}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-300">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            {featured?.time || "Ahora"}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Categoría: {featured?.category || "TV"}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                            Fuente: {featured?.badge || "AR"}
                          </span>
                        </div>
                      </div>

                      <div className="hidden rounded-[24px] border border-white/10 bg-black/20 p-4 backdrop-blur md:block">
                        <div className="aspect-video w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
                          <video
                            ref={videoRef}
                            controls
                            autoPlay
                            playsInline
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-[#f6a531] px-5 py-3 font-bold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:brightness-110">
                        <Play className="h-5 w-5 fill-current" />
                        Ver ahora
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10">
                        <Volume2 className="h-5 w-5" />
                        Audio
                      </button>
                      <button
                        onClick={() => {
                          const video = videoRef.current;
                          if (video?.requestFullscreen) video.requestFullscreen();
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                      >
                        <Maximize className="h-5 w-5" />
                        Pantalla completa
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold">Agenda / destacados</h3>
                  <span className="text-xs text-slate-400">MQTV</span>
                </div>
                <div className="space-y-3">
                  {agenda.length ? (
                    agenda.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedChannel(item);
                          setSelectedCategory("Deportes");
                        }}
                        className="w-full rounded-2xl border border-white/10 bg-[#0f1d30] p-4 text-left transition hover:border-orange-400/40 hover:bg-[#142640]"
                      >
                        <div className="mb-2 text-sm font-bold text-[#5ef2c3]">
                          DEPORTES
                        </div>
                        <div className="text-lg font-bold">{item.name}</div>
                        <div className="mt-1 text-sm text-slate-400">
                          {item.streamUrl ? "Disponible" : "Sin señal"}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                      Sin destacados cargados.
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="mt-5">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                        active
                          ? "bg-[#f6a531] text-slate-950"
                          : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {cat !== "Todos los canales" ? (
                        categoryIcon(cat)
                      ) : (
                        <Grid2x2 className="h-4 w-4" />
                      )}
                      {cat}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-xl font-black">{selectedCategory}</h3>
                    <p className="text-sm text-slate-400">
                      {filtered.length} canales visibles · {sourceStatus}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-[#0f1d30] p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`rounded-xl px-3 py-2 ${
                        viewMode === "grid"
                          ? "bg-[#f6a531] text-slate-950"
                          : "text-slate-300"
                      }`}
                    >
                      <Grid2x2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`rounded-xl px-3 py-2 ${
                        viewMode === "list"
                          ? "bg-[#f6a531] text-slate-950"
                          : "text-slate-300"
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                    {filtered.map((channel) => {
                      const active = featured?.id === channel.id;
                      return (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={`group rounded-[24px] border p-4 text-left transition ${
                            active
                              ? "border-orange-400/60 bg-[#13243a] shadow-lg shadow-orange-500/10"
                              : "border-white/10 bg-[#0f1d30] hover:border-white/20 hover:bg-[#13243a]"
                          }`}
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <Logo channel={channel} />
                            <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">
                              {channel.badge}
                            </span>
                          </div>
                          <div className="text-base font-bold leading-tight">
                            {channel.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-400">
                            {channel.category}
                          </div>
                          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
                            <div className="h-full w-2/3 rounded-full bg-[#28d7ff]" />
                          </div>
                          <div className="mt-2 text-xs text-slate-500">
                            {channel.streamUrl ? "Disponible" : "Sin señal"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filtered.map((channel) => {
                      const active = featured?.id === channel.id;
                      return (
                        <button
                          key={channel.id}
                          onClick={() => setSelectedChannel(channel)}
                          className={`flex w-full items-center gap-4 rounded-[24px] border p-4 text-left transition ${
                            active
                              ? "border-orange-400/60 bg-[#13243a]"
                              : "border-white/10 bg-[#0f1d30] hover:border-white/20 hover:bg-[#13243a]"
                          }`}
                        >
                          <Logo channel={channel} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-lg font-bold">
                                {channel.name}
                              </span>
                              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] font-bold text-slate-300">
                                {channel.category}
                              </span>
                            </div>
                            <div className="truncate text-sm text-slate-400">
                              Grupo: {channel.groupTitle || "TV"}
                            </div>
                            <div className="truncate text-xs text-slate-500">
                              {channel.streamUrl}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>

        <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-white/10 bg-[#081320]/95 px-4 py-3 backdrop-blur md:hidden">
          <button className="flex flex-col items-center gap-1 text-[#f6a531]">
            <Home className="h-5 w-5" />
            <span className="text-xs">Inicio</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white">
            <MonitorPlay className="h-5 w-5" />
            <span className="text-xs">Grilla TV</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white">
            <Trophy className="h-5 w-5" />
            <span className="text-xs">Deportes</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white">
            <Info className="h-5 w-5" />
            <span className="text-xs">Acerca de</span>
          </button>
        </nav>
      </div>
    </div>
  );
}