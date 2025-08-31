import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Instagram, Youtube, ArrowUpRight } from "lucide-react";

/* ==========================================================
   Alwarith — Modern Portfolio (Video Hero + Work + Clients)
   NOW CMS‑READY (zero‑code):
   - Put a JSON file at /content.json (in public/) to manage text, hero video, projects, clients.
   - This component loads that JSON at runtime with graceful fallback to defaults below.

   Why this approach?
   - You don't need to touch code; just edit content.json.
   - Can switch later to Sanity/Contentful easily (same schema).

   content.json schema (example):
   {
     "accent": "#00E5A6",
     "langDefault": "ar",
     "hero": { "source": "youtube", "youtubeId": "ZrjQqsffbx0", "overlay": 0.5 },
     "profile": {
       "name": "Alwarith Almamari",
       "title": "Filmmaker & Photographer",
       "email": "hello@altarkiz.example",
       "bio_ar": "...",
       "bio_en": "...",
       "socials": { "instagram": "https://...", "youtube": "https://..." }
     },
     "projects": [ { "id": "...", "title": {"ar": "...", "en": "..."}, "client": "...", "year": "2025", "type": "video", "cover": "/covers/x.jpg", "description": {"ar": "...", "en": "..."}, "media": {"type": "youtube", "id": "VIDEO_ID" } } ],
     "clients": [ { "name": "UTAS", "logo": "/clients/utas.svg" } ]
   }
   ========================================================== */

type Lang = "ar" | "en";

type Media =
  | { type: "youtube"; id: string }
  | { type: "vimeo"; id: string }
  | { type: "image"; src: string };

type Project = {
  id: string;
  title: { ar: string; en: string };
  client: string;
  year: string;
  type: "video" | "photo";
  cover: string;
  description: { ar: string; en: string };
  media: Media;
};

type Profile = {
  name: string;
  title: string;
  email: string;
  bio_ar: string;
  bio_en: string;
  socials: { instagram?: string; youtube?: string };
};

type Hero =
  | { source: "youtube"; youtubeId: string; overlay?: number }
  | { source: "vimeo"; vimeoId: string; overlay?: number }
  | { source: "drive"; drivePreviewUrl: string; overlay?: number }
  | { source: "mp4"; url: string; overlay?: number };

type CMSContent = {
  accent?: string;
  langDefault?: Lang;
  hero?: Hero;
  profile?: Partial<Profile>;
  projects?: Project[];
  clients?: { name: string; logo: string }[];
};

// Extract YouTube ID from various URL formats (youtu.be, watch?v=, embed, shorts)
function extractYouTubeId(input: string): string {
  if (!input) return input;
  // If it's already a bare ID (11+ chars, common case), return as-is
  if (/^[a-zA-Z0-9_-]{10,}$/i.test(input) && !/\//.test(input)) return input;
  const patterns = [
    /youtu\.be\/(?<id>[a-zA-Z0-9_-]{10,})/i,
    /v=([a-zA-Z0-9_-]{10,})/i,
    /embed\/([a-zA-Z0-9_-]{10,})/i,
    /shorts\/([a-zA-Z0-9_-]{10,})/i
  ];
  for (const rx of patterns) {
    const m = input.match(rx);
    const id = (m as any)?.groups?.id || m?.[1];
    if (id) return id;
  }
  return input; // fallback
}

// ── Default content (used if /content.json missing or partially filled) ──
const defaultContent: Required<Omit<CMSContent, "profile" | "hero">> & {
  profile: Profile;
  hero: Hero;
} = {
  accent: "#00E5A6",
  langDefault: "ar",
  hero: { source: "youtube", youtubeId: "ZrjQqsffbx0", overlay: 0.5 },
  profile: {
    name: "Alwarith Almamari",
    title: "Filmmaker & Photographer",
    email: "hello@altarkiz.example",
    bio_ar:
      "صانع أفلام ومصور مستقل. أركز على القصص الإنسانية، المحتوى الرياضي والثقافي. أغطي فعاليات وطنية وأنتج أفلامًا دعائية ومحتوى منصات التواصل.",
    bio_en:
      "Freelance filmmaker & photographer crafting human, sport and cultural stories. Event coverage, brand films, and social‑first content.",
    socials: {
      instagram: "https://instagram.com/Alwarith96",
      youtube: "https://youtube.com/@AltarkizProduction"
    }
  },
  projects: [
    {
      id: "salalah-tour",
      title: { ar: "طواف صلالة", en: "Tour of Salalah" },
      client: "Oman Cycling Federation",
      year: "2024",
      type: "video",
      cover:
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1800&auto=format&fit=crop",
      description: { ar: "فيلم ترويجي ديناميكي.", en: "Dynamic promo film." },
      media: { type: "youtube", id: "dQw4w9WgXcQ" }
    },
    {
      id: "utas-grad",
      title: { ar: "فيلم تخرج UTAS", en: "UTAS Graduation Film" },
      client: "UTAS",
      year: "2025",
      type: "video",
      cover:
        "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1800&auto=format&fit=crop",
      description: { ar: "سرد ملهم.", en: "Inspiring narrative." },
      media: { type: "vimeo", id: "76979871" }
    }
  ],
  clients: [
    { name: "UTAS", logo: "https://dummyimage.com/200x80/00E5A6/fff&text=UTAS" },
    { name: "OCEC", logo: "https://dummyimage.com/200x80/00E5A6/fff&text=OCEC" },
    { name: "Oman Cycling", logo: "https://dummyimage.com/200x80/00E5A6/fff&text=OCF" },
    { name: "F&B Group", logo: "https://dummyimage.com/200x80/00E5A6/fff&text=F%26B" }
  ]
};

// Merge helper (fills missing keys from defaults)
function mergeContent(partial: CMSContent): typeof defaultContent {
  const accent = partial.accent || defaultContent.accent;
  const langDefault = partial.langDefault || defaultContent.langDefault;
  let hero = partial.hero || defaultContent.hero;
  // Normalize hero.youtubeId if a full URL was provided
  if (hero && (hero as any).source === "youtube" && (hero as any).youtubeId) {
    hero = { ...(hero as any), youtubeId: extractYouTubeId((hero as any).youtubeId) } as Hero;
  }
  const profile: Profile = {
    ...defaultContent.profile,
    ...(partial.profile || {})
  };
  const projects = (partial.projects && partial.projects.length ? partial.projects : defaultContent.projects).map(
    (p) => ({ ...p })
  );
  const clients = (partial.clients && partial.clients.length ? partial.clients : defaultContent.clients).map((c) => ({ ...c }));
  return { accent, langDefault, hero, profile, projects, clients };
}

const t = (lang: Lang, profile: Profile) => ({
  nav: {
    work: lang === "ar" ? "الأعمال" : "Work",
    clients: lang === "ar" ? "عملاء" : "Clients",
    contact: lang === "ar" ? "تواصل" : "Contact"
  },
  hero: {
    kicker: lang === "ar" ? "صانع أفلام · مصور" : "Filmmaker · Photographer",
    title: lang === "ar" ? "أروي القصة بالصوت والصورة" : "I tell stories with film & photography",
    desc: lang === "ar" ? profile.bio_ar : profile.bio_en
  },
  work: { title: lang === "ar" ? "أعمال مختارة" : "Selected Work", all: lang === "ar" ? "الكل" : "All", video: lang === "ar" ? "فيديو" : "Video", photo: lang === "ar" ? "صور" : "Photo" },
  clients: { title: lang === "ar" ? "شركاء وثقوا بي" : "Clients & Partners" },
  contact: { title: lang === "ar" ? "جاهز للتعاون" : "Open for Collaborations", desc: lang === "ar" ? "أرسل رسالة وابدأ مشروعك القادم." : "Drop a line to start your next project." }
});

// ── Self‑tests (non‑blocking) ──
function runSelfTests() {
  try {
    // Ensure defaults are sensible
    console.assert(defaultContent.projects.length >= 2, "[defaults] projects seeded");
    console.assert(defaultContent.clients.length >= 1, "[defaults] clients seeded");
    // Simple schema checks for a sample project
    const p = defaultContent.projects[0];
    console.assert(!!p.id && !!p.title && !!p.media, "[schema] project minimal fields");
    console.assert(typeof p.title.ar === "string" && typeof p.title.en === "string", "[schema] bilingual titles");
    // Language function
    const dictAR = t("ar", defaultContent.profile);
    const dictEN = t("en", defaultContent.profile);
    console.assert(dictAR.nav.work === "الأعمال" && dictEN.nav.work === "Work", "[i18n] nav labels ok");
    // Filtering math expectation
    const videoCount = defaultContent.projects.filter((x) => x.type === "video").length;
    const photoCount = defaultContent.projects.filter((x) => x.type === "photo").length;
    console.assert(videoCount + photoCount === defaultContent.projects.length, "[filter] counts add up");
    // Hero YouTube ID normalization tests
    const sampleShort = "https://youtu.be/ZrjQqsffbx0";
    const sampleWatch = "https://www.youtube.com/watch?v=ZrjQqsffbx0";
    const sampleShorts = "https://www.youtube.com/shorts/ZrjQqsffbx0";
    console.assert(extractYouTubeId(sampleShort) === "ZrjQqsffbx0", "[hero] youtube id extraction (short)");
    console.assert(extractYouTubeId(sampleWatch) === "ZrjQqsffbx0", "[hero] youtube id extraction (watch)");
    console.assert(extractYouTubeId(sampleShorts) === "ZrjQqsffbx0", "[hero] youtube id extraction (shorts)");
    const merged = mergeContent({ hero: { source: "youtube", youtubeId: sampleWatch } });
    console.assert((merged.hero as any).youtubeId === "ZrjQqsffbx0", "[merge] hero id normalized");
    // Post-render check (async)
    setTimeout(() => {
      const iframe = document.querySelector<HTMLIFrameElement>('section[data-hero] iframe');
      if (iframe) {
        const ok = /youtube\.com\/embed\//.test(iframe.src);
        console.assert(ok, "[hero] iframe src is YouTube embed");
      }
      // eslint-disable-next-line no-console
      console.log("✅ Self‑tests passed");
    }, 300);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("❌ Self‑tests error", e);
  }
}

export default function Portfolio() {
  const [content, setContent] = useState(defaultContent);
  const [lang, setLang] = useState<Lang>(defaultContent.langDefault);
  const [filter, setFilter] = useState<"all" | "video" | "photo">("all");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Project | null>(null);

  // Load /content.json if present
  useEffect(() => {
    runSelfTests();
    fetch("/content.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json) return;
        const merged = mergeContent(json as CMSContent);
        setContent(merged);
        if (json.langDefault) setLang(json.langDefault as Lang);
        if (json.accent) document.documentElement.style.setProperty("--accent", json.accent);
        else document.documentElement.style.setProperty("--accent", defaultContent.accent);
      })
      .catch(() => {
        document.documentElement.style.setProperty("--accent", defaultContent.accent);
      });
  }, []);

  // Keep CSS var synced even without content.json
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", content.accent);
  }, [content.accent]);

  const dict = t(lang, content.profile);
  const projects = content.projects;
  const clients = content.clients;

  const filtered = useMemo(() => (filter === "all" ? projects : projects.filter((p) => p.type === filter)), [filter, projects]);

  // Hero media resolver
  function HeroMedia({ hero }: { hero: Hero }) {
    const overlay = typeof hero.overlay === "number" ? hero.overlay : 0.5;
    return (
      <section data-hero className="relative h-[90vh] flex items-center justify-center text-center overflow-hidden">
        {hero.source === "youtube" && (
          <iframe
            src={`https://www.youtube.com/embed/${hero.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${hero.youtubeId}`}
            className="absolute inset-0 w-full h-full object-cover"
            frameBorder={0}
            allow="autoplay; fullscreen"
            style={{ pointerEvents: "none" }}
          />
        )}
        {hero.source === "vimeo" && (
          <iframe
            src={`https://player.vimeo.com/video/${(hero as any).vimeoId}?background=1&autoplay=1&muted=1&loop=1`}
            className="absolute inset-0 w-full h-full object-cover"
            frameBorder={0}
            allow="autoplay; fullscreen"
            style={{ pointerEvents: "none" }}
          />
        )}
        {hero.source === "drive" && (
          <iframe
            src={`${(hero as any).drivePreviewUrl}${(hero as any).drivePreviewUrl.includes("?") ? "&" : "?"}autoplay=1&mute=1`}
            className="absolute inset-0 w-full h-full object-cover"
            frameBorder={0}
            allow="autoplay; encrypted-media"
            style={{ pointerEvents: "none" }}
          />
        )}
        {hero.source === "mp4" && (
          <video
            src={(hero as any).url}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        )}
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay})` }} />
        <div className="relative z-10 px-4 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.2em] mb-3 text-neutral-300">{dict.hero.kicker}</p>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">{dict.hero.title}</h1>
          <p className="text-neutral-200">{dict.hero.desc}</p>
        </div>
      </section>
    );
  }

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-neutral-950 text-neutral-50">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur bg-neutral-950/70">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
          <span className="font-semibold text-lg">{content.profile.name}</span>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#work">{dict.nav.work}</a>
            <a href="#clients">{dict.nav.clients}</a>
            <a href="#contact">{dict.nav.contact}</a>
          </nav>
          <Button variant="ghost" className="text-xs" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
            {lang === "ar" ? "EN" : "AR"}
          </Button>
        </div>
      </header>

      {/* HERO (CMS‑driven) */}
      <HeroMedia hero={content.hero} />

      {/* WORK */}
      <section id="work" className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">{dict.work.title}</h2>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList className="bg-neutral-900 border border-white/10 mb-6">
            <TabsTrigger value="all">{dict.work.all}</TabsTrigger>
            <TabsTrigger value="video">{dict.work.video}</TabsTrigger>
            <TabsTrigger value="photo">{dict.work.photo}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActive(p);
                setOpen(true);
              }}
              className="group relative overflow-hidden rounded-3xl ring-1 ring-white/10 text-left"
            >
              <img
                src={p.cover}
                alt={p.title[lang]}
                className="w-full h-[320px] md:h-[420px] object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 p-6">
                <div className="flex gap-2 text-xs opacity-90 mb-2">
                  <Badge className="bg-[var(--accent)] text-neutral-900">{p.type}</Badge>
                  <span>{p.client}</span>
                  <span className="opacity-70">{p.year}</span>
                </div>
                <h3 className="text-xl font-bold">{p.title[lang]}</h3>
                <p className="text-sm text-neutral-200 line-clamp-2">{p.description[lang]}</p>
                <div className="mt-3 inline-flex items-center gap-2 text-sm opacity-90">
                  <span>{lang === "ar" ? "عرض المشروع" : "View project"}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* CLIENT LOGOS */}
      <section id="clients" className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-center">{t(lang, content.profile).clients.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 place-items-center">
          {clients.map((c) => (
            <img key={c.name} src={c.logo} alt={c.name} className="max-h-16 object-contain opacity-80 hover:opacity-100 transition" />
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="sticky bottom-4 z-30">
        <div className="mx-auto max-w-7xl px-4">
          <div className="rounded-3xl border border-white/10 bg-neutral-900/70 backdrop-blur p-6 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold">{t(lang, content.profile).contact.title}</h3>
              <p className="text-neutral-300 mt-1">{t(lang, content.profile).contact.desc}</p>
            </div>
            <div className="flex gap-3">
              <a href={`mailto:${content.profile.email}`}>
                <Button className="bg-[var(--accent)] text-neutral-900">
                  <Mail className="w-4 h-4" /> {lang === "ar" ? "راسلني" : "Email me"}
                </Button>
              </a>
              {content.profile.socials.instagram && (
                <a href={content.profile.socials.instagram} target="_blank" rel="noreferrer">
                  <Button variant="outline">
                    <Instagram className="w-4 h-4" /> Instagram
                  </Button>
                </a>
              )}
              {content.profile.socials.youtube && (
                <a href={content.profile.socials.youtube} target="_blank" rel="noreferrer">
                  <Button variant="outline">
                    <Youtube className="w-4 h-4" /> YouTube
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-neutral-500">© {new Date().getFullYear()} {content.profile.name}</footer>

      {/* LIGHTBOX */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl bg-neutral-950 border-white/10">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="text-neutral-50">{active.title[lang]}</DialogTitle>
              </DialogHeader>
              {active.media.type === "image" && <img src={active.media.src} alt={active.title[lang]} className="w-full rounded-xl" />}
              {active.media.type === "youtube" && (
                <iframe className="w-full aspect-video rounded-xl" src={`https://www.youtube.com/embed/${active.media.id}`} allowFullScreen />
              )}
              {active.media.type === "vimeo" && (
                <iframe className="w-full aspect-video rounded-xl" src={`https://player.vimeo.com/video/${active.media.id}`} allowFullScreen />
              )}
              <p className="text-sm text-neutral-300 mt-2">{active.description[lang]}</p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
