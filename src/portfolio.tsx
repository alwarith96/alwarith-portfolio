import React, { useEffect, useMemo, useState } from "react";

/* ==========================================================
   Altarkiz — Company Portfolio (Plain React + Inline CSS)
   - لا يحتاج Tailwind أو مكتبات إضافية
   - المحتوى من /public/content.json (CMS بسيط بدون كود)
   - هيرو فيديو يوتيوب صامت + تشغيل تلقائي + تكرار
   - يدعم نمط "شركة" مع قسم "الإدارة" (فريق الإدارة)
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
  name: string; // اسم الشركة أو الشخص - يُعرض في الهيدر والفوتر
  title: string; // سطر قصير تحت الاسم (شعار/وصف)
  email: string;
  bio_ar: string;
  bio_en: string;
  socials: { instagram?: string; youtube?: string };
};

type Company = {
  name?: string; // يطغى على profile.name إن وُجد
  tagline_ar?: string;
  tagline_en?: string;
  about_ar?: string;
  about_en?: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: { ar: string; en: string };
  photo?: string; // صورة مربعة يفضل 600x600
  bio?: { ar?: string; en?: string };
  links?: { instagram?: string; linkedin?: string; email?: string };
};

type Hero =
  | { source: "youtube"; youtubeId: string; overlay?: number }
  | { source: "vimeo"; vimeoId: string; overlay?: number }
  | { source: "drive"; drivePreviewUrl: string; overlay?: number }
  | { source: "mp4"; url: string; overlay?: number };

type CMSContent = {
  accent?: string;
  langDefault?: Lang;
  siteType?: "company" | "personal";
  company?: Company; // لنصوص الشركة والمسميات
  hero?: Hero;
  profile?: Partial<Profile>;
  projects?: Project[];
  clients?: { name: string; logo: string }[];
  team?: TeamMember[]; // قسم الإدارة
};

// استخراج ID من روابط اليوتيوب المختلفة
function extractYouTubeId(input: string): string {
  if (!input) return input;
  if (/^[a-zA-Z0-9_-]{10,}$/.test(input) && !/\//.test(input)) return input;
  const patterns = [
    /youtu\.be\/(?<id>[a-zA-Z0-9_-]{10,})/i,
    /[?&]v=([a-zA-Z0-9_-]{10,})/i,
    /embed\/([a-zA-Z0-9_-]{10,})/i,
    /shorts\/([a-zA-Z0-9_-]{10,})/i
  ];
  for (const rx of patterns) {
    const m = input.match(rx);
    const id = (m as any)?.groups?.id || m?.[1];
    if (id) return id;
  }
  return input;
}

// الافتراضيات — معدلة لوضع الشركة Altarkiz
const defaultContent: Required<Omit<CMSContent, "profile" | "hero" | "company" | "team">> & {
  profile: Profile;
  hero: Hero;
  company: Company;
  team: TeamMember[];
} = {
  accent: "#00E5A6",
  langDefault: "ar",
  siteType: "company",
  hero: { source: "youtube", youtubeId: "ZrjQqsffbx0", overlay: 0.45 },
  company: {
    name: "Altarkiz Production",
    tagline_ar: "شركة إنتاج محتوى بصري",
    tagline_en: "Visual Content Production Studio",
    about_ar: "نقدّم إنتاج أفلام وإخراج وتصوير فوتوغرافي للأفراد والجهات. نركز على القصص الإنسانية، الرياضة، والثقافة مع تنفيذ احترافي سريع.",
    about_en: "We produce films and photography for brands and institutions, focusing on human, sport and cultural stories with fast professional delivery."
  },
  profile: {
    name: "Altarkiz Production",
    title: "Visual Content Studio",
    email: "hello@altarkiz.example",
    bio_ar:
      "نقدّم إنتاج أفلام وإخراج وتصوير فوتوغرافي للأفراد والجهات. نركز على القصص الإنسانية، الرياضة، والثقافة.",
    bio_en:
      "We craft brand films and photography with a focus on human, sport and culture.",
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
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1600&auto=format&fit=crop",
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
        "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1600&auto=format&fit=crop",
      description: { ar: "سرد ملهم.", en: "Inspiring narrative." },
      media: { type: "vimeo", id: "76979871" }
    }
  ],
  clients: [
    { name: "UTAS", logo: "https://dummyimage.com/200x80/00E5A6/fff&text=UTAS" },
    { name: "OCEC", logo: "https://dummyimage.com/200x80/00E5A6/fff&text=OCEC" },
    { name: "Oman Cycling", logo: "https://dummyimage.com/200x80/00E5A6/fff&text=OCF" },
    { name: "F&B Group", logo: "https://dummyimage.com/200x80/00E5A6/fff&text=F%26B" }
  ],
  team: [
    { id: "alwarith", name: "Alwarith Almamari", role: { ar: "المدير التنفيذي / مخرج", en: "CEO / Director" }, photo: "https://dummyimage.com/600x600/111/fff&text=A" },
    { id: "producer", name: "Sara A.", role: { ar: "منتج", en: "Producer" }, photo: "https://dummyimage.com/600x600/111/fff&text=S" }
  ]
};

function mergeContent(partial: CMSContent): typeof defaultContent {
  const accent = partial.accent || defaultContent.accent;
  const langDefault = partial.langDefault || defaultContent.langDefault;
  const siteType = partial.siteType || defaultContent.siteType;
  let hero = partial.hero || defaultContent.hero;
  if (hero && (hero as any).source === "youtube") {
    hero = { ...(hero as any), youtubeId: extractYouTubeId((hero as any).youtubeId) } as Hero;
  }
  const company: Company = { ...defaultContent.company, ...(partial.company || {}) };
  const profile: Profile = { ...defaultContent.profile, ...(partial.profile || {}) };
  const projects = (partial.projects?.length ? partial.projects : defaultContent.projects).map((p) => ({ ...p }));
  const clients = (partial.clients?.length ? partial.clients : defaultContent.clients).map((c) => ({ ...c }));
  const team = (partial.team?.length ? partial.team : defaultContent.team).map((m) => ({ ...m }));
  return { accent, langDefault, siteType, hero, company, profile, projects, clients, team } as any;
}

const dictFor = (lang: Lang, profile: Profile, siteType: CMSContent["siteType"], company: Company) => {
  const heroTitle = siteType === "company"
    ? (lang === "ar" ? (company.tagline_ar || "شركة إنتاج محتوى بصري") : (company.tagline_en || "Visual Content Production Studio"))
    : (lang === "ar" ? "أروي القصة بالصوت والصورة" : "I tell stories with film & photography");
  const heroDesc = siteType === "company"
    ? (lang === "ar" ? (company.about_ar || profile.bio_ar) : (company.about_en || profile.bio_en))
    : (lang === "ar" ? profile.bio_ar : profile.bio_en);
  return {
    nav: {
      work: lang === "ar" ? "الأعمال" : "Work",
      clients: lang === "ar" ? "عملاء" : "Clients",
      team: lang === "ar" ? "الإدارة" : "Management",
      contact: lang === "ar" ? "تواصل" : "Contact"
    },
    hero: {
      kicker: siteType === "company" ? (lang === "ar" ? "شركة التركيز" : "Altarkiz Production") : (lang === "ar" ? "صانع أفلام · مصور" : "Filmmaker · Photographer"),
      title: heroTitle,
      desc: heroDesc
    },
    work: { title: lang === "ar" ? "أعمال مختارة" : "Selected Work", all: lang === "ar" ? "الكل" : "All", video: lang === "ar" ? "فيديو" : "Video", photo: lang === "ar" ? "صور" : "Photo" },
    clients: { title: lang === "ar" ? "شركاء وثقوا بنا" : "Clients & Partners" },
    team: { title: lang === "ar" ? "فريق الإدارة" : "Management Team" },
    contact: { title: lang === "ar" ? "جاهزون للتعاون" : "Open for Collaborations", desc: lang === "ar" ? "أرسل رسالة وابدأ مشروعك القادم." : "Drop a line to start your next project." }
  };
};

export default function Portfolio() {
  const [content, setContent] = useState(defaultContent);
  const [lang, setLang] = useState<Lang>(defaultContent.langDefault);
  const [filter, setFilter] = useState<"all" | "video" | "photo">("all");
  const [active, setActive] = useState<Project | null>(null);

  // حمّل content.json (لو موجود)
  useEffect(() => {
    fetch("/content.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json) return;
        const merged = mergeContent(json as CMSContent);
        setContent(merged);
        if ((json as CMSContent).langDefault) setLang((json as CMSContent).langDefault as Lang);
      })
      .catch(() => {});
  }, []);

  // CSS متغير اللون
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", content.accent);
  }, [content.accent]);

  const dict = dictFor(lang, content.profile, content.siteType, content.company);
  const projects = content.projects;
  const clients = content.clients;
  const team = content.team;
  const filtered = useMemo(
    () => (filter === "all" ? projects : projects.filter((p) => p.type === filter)),
    [filter, projects]
  );

  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* ------------- STYLES ------------- */}
      <style>{`
        :root{ --accent:${content.accent}; }
        *{ box-sizing: border-box; }
        body{ margin:0; }
        .wrap{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#0a0a0a; color:#f4f4f4; min-height:100vh; }
        .max{ max-width:1100px; margin:0 auto; padding:0 16px; }
        a{ color:inherit; }
        header{ position:sticky; top:0; z-index:20; background:rgba(10,10,10,.7); backdrop-filter:saturate(1.2) blur(10px); border-bottom:1px solid rgba(255,255,255,.06); }
        header .bar{ height:64px; display:flex; align-items:center; justify-content:space-between; }
        .btn{ border:1px solid rgba(255,255,255,.15); background:transparent; color:#f4f4f4; padding:8px 12px; border-radius:10px; cursor:pointer; }
        .btn-accent{ background:var(--accent); color:#0a0a0a; border:none; }
        .hero{ position:relative; height:88vh; display:flex; align-items:center; justify-content:center; text-align:center; overflow:hidden; }
        .hero iframe,.hero video{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; pointer-events:none; }
        .hero .overlay{ position:absolute; inset:0; background:rgba(0,0,0,${(content.hero as any).overlay ?? 0.45}); }
        .hero .inner{ position:relative; z-index:2; padding:0 16px; max-width:800px; }
        .kicker{ text-transform:uppercase; letter-spacing:.25em; color:#d1d1d1; font-size:12px; margin-bottom:8px; }
        .h1{ font-weight:900; font-size:40px; margin:8px 0 12px; }
        .muted{ color:#d1d1d1; }
        .tabs{ display:flex; gap:8px; border:1px solid rgba(255,255,255,.12); padding:6px; border-radius:12px; background:#121212; width:max-content; }
        .tab{ padding:8px 12px; border-radius:8px; cursor:pointer; }
        .tab.active{ background:rgba(255,255,255,.08); }
        .grid{ display:grid; gap:16px; grid-template-columns:repeat(1,1fr); }
        @media(min-width:800px){ .grid{ grid-template-columns:repeat(2,1fr);} .h1{ font-size:56px; } }
        .card{ position:relative; border:1px solid rgba(255,255,255,.1); border-radius:18px; overflow:hidden; background:#101010; }
        .card img{ width:100%; height:320px; object-fit:cover; display:block; }
        .card .g{ position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,.7), transparent 50%); }
        .card .meta{ position:absolute; bottom:0; padding:16px; }
        .badge{ display:inline-block; background:var(--accent); color:#0a0a0a; font-weight:600; border-radius:9999px; font-size:12px; padding:4px 8px; margin-inline-end:6px; }
        .logos{ display:grid; gap:16px; grid-template-columns:repeat(2,1fr); place-items:center; }
        @media(min-width:800px){ .logos{ grid-template-columns:repeat(4,1fr); } }
        .logos img{ max-height:52px; opacity:.85; filter:grayscale(30%); }
        .team{ display:grid; gap:16px; grid-template-columns:repeat(1,1fr); }
        @media(min-width:800px){ .team{ grid-template-columns:repeat(3,1fr); } }
        .person{ border:1px solid rgba(255,255,255,.1); border-radius:16px; padding:14px; background:#101010; text-align:center; }
        .person img{ width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:12px; }
        .cta{ position:sticky; bottom:12px; }
        footer{ text-align:center; color:#a1a1a1; padding:32px 0; }
        .nav a{ text-decoration:none; opacity:.9; }
        .nav a:hover{ opacity:1; }
        .section{ padding:56px 0; }
        .title{ font-size:28px; font-weight:700; margin:0 0 16px; }
        dialog[open]{ border:none; border-radius:16px; background:#0a0a0a; color:#f4f4f4; width:min(900px, 92vw); }
       .logos-marquee {
  overflow: hidden;
  position: relative;
  width: 100%;
}
.logos-track {
  display: inline-block;
  white-space: nowrap;
  animation: marquee 25s linear infinite;
}
.logos-marquee:hover .logos-track {
  animation-play-state: paused; /* ✨ توقف عند hover */
}
.logo-item {
  display: inline-block;
  padding: 0 40px; /* المسافة بين الشعارات */
}
.logo-item img {
  max-height: 52px;
  opacity: 0.85;
  filter: grayscale(30%);
  transition: opacity 0.3s;
}
.logo-item img:hover {
  opacity: 1;
  filter: none;
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

      `
      }</style>

      <div className="wrap">
        {/* NAV */}
        <header>
          <div className="max bar">
            <div style={{ fontWeight: 700 }}>{content.company.name || content.profile.name}</div>
            <nav className="nav" style={{ display: "flex", gap: 16, fontSize: 14 }}>
              <a href="#work">{dict.nav.work}</a>
              <a href="#clients">{dict.nav.clients}</a>
              <a href="#team">{dict.nav.team}</a>
              <a href="#contact">{dict.nav.contact}</a>
            </nav>
            <button className="btn" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>
              {lang === "ar" ? "EN" : "AR"}
            </button>
          </div>
        </header>

        {/* HERO */}
        <section className="hero">
          {content.hero.source === "youtube" && (
            <iframe
              src={`https://www.youtube.com/embed/${(content.hero as any).youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${(content.hero as any).youtubeId}`}
              title="Hero video"
              frameBorder={0}
              allow="autoplay; fullscreen"
            />
          )}
          {content.hero.source === "vimeo" && (
            <iframe
              src={`https://player.vimeo.com/video/${(content.hero as any).vimeoId}?background=1&autoplay=1&muted=1&loop=1`}
              title="Hero vimeo"
              frameBorder={0}
              allow="autoplay; fullscreen"
            />
          )}
          {content.hero.source === "drive" && (
            <iframe
              src={`${(content.hero as any).drivePreviewUrl}${(content.hero as any).drivePreviewUrl.includes("?") ? "&" : "?"}autoplay=1&mute=1`}
              title="Hero drive"
              frameBorder={0}
              allow="autoplay; encrypted-media"
            />
          )}
          {content.hero.source === "mp4" && (
            <video src={(content.hero as any).url} autoPlay muted loop playsInline />
          )}
          <div className="overlay" />
          <div className="inner">
            <div className="kicker">{dict.hero.kicker}</div>
            <h1 className="h1">{dict.hero.title}</h1>
            <p className="muted">{dict.hero.desc}</p>
          </div>
        </section>

        {/* WORK */}
        <section id="work" className="section">
          <div className="max">
            <h2 className="title">{dict.work.title}</h2>
            <div className="tabs" role="tablist" aria-label="Filter projects">
              {(["all", "video", "photo"] as const).map((k) => (
                <div
                  key={k}
                  className={`tab ${filter === k ? "active" : ""}`}
                  onClick={() => setFilter(k)}
                  role="tab"
                  aria-selected={filter === k}
                >
                  {k === "all" ? dict.work.all : k === "video" ? dict.work.video : dict.work.photo}
                </div>
              ))}
            </div>

            <div className="grid" style={{ marginTop: 16 }}>
              {filtered.map((p) => (
                <div className="card" key={p.id} onClick={() => setActive(p)}>
                  <img src={p.cover} alt={p.title[lang]} />
                  <div className="g" />
                  <div className="meta">
                    <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
                      <span className="badge">{p.type}</span>
                      <span style={{ marginInlineEnd: 8 }}>{p.client}</span>
                      <span style={{ opacity: 0.7 }}>{p.year}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 18 }}>{p.title[lang]}</div>
                    <div className="muted" style={{ fontSize: 14 }}>{p.description[lang]}</div>
                    <div style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>
                      {lang === "ar" ? "عرض المشروع" : "View project"} →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

{/* CLIENT LOGOS (Infinite Marquee) */}
<section id="clients" className="section" style={{ paddingTop: 24 }}>
  <div className="max">
    <h2 className="title" style={{ textAlign: "center", marginBottom: 24 }}>
      {dict.clients.title}
    </h2>
    <div className="logos-marquee">
      <div className="logos-track">
        {clients.map((c, i) => (
          <span key={c.name + i} className="logo-item">
            <img src={c.logo} alt={c.name} />
          </span>
        ))}
        {clients.map((c, i) => (
          <span key={c.name + "dup" + i} className="logo-item">
            <img src={c.logo} alt={c.name} />
          </span>
        ))}
      </div>
    </div>
  </div>
</section>



        {/* TEAM / MANAGEMENT */}
        <section id="team" className="section">
          <div className="max">
            <h2 className="title">{dict.team.title}</h2>
            <div className="team">
              {team.map((m) => (
                <div key={m.id} className="person">
                  {m.photo && <img src={m.photo} alt={m.name} />}
                  <div style={{ fontWeight: 800, marginTop: 10 }}>{m.name}</div>
                  <div className="muted" style={{ fontSize: 14 }}>{lang === "ar" ? m.role.ar : m.role.en}</div>
                  {m.bio && (m.bio[lang] || m.bio.ar || m.bio.en) && (
                    <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{m.bio[lang as keyof typeof m.bio] || m.bio.ar || m.bio.en}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="cta">
          <div className="max" style={{ marginBottom: 16 }}>
            <div
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(20,20,20,.8)",
                borderRadius: 16,
                padding: 16,
                display: "flex",
                gap: 12,
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap"
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{dict.contact.title}</div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {dict.contact.desc}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={`mailto:${content.profile.email}`} className="btn btn-accent">
                  {lang === "ar" ? "راسلنا" : "Email us"}
                </a>
                {content.profile.socials.instagram && (
                  <a href={content.profile.socials.instagram} target="_blank" rel="noreferrer" className="btn">
                    Instagram
                  </a>
                )}
                {content.profile.socials.youtube && (
                  <a href={content.profile.socials.youtube} target="_blank" rel="noreferrer" className="btn">
                    YouTube
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer>© {new Date().getFullYear()} {content.company.name || content.profile.name}</footer>
      </div>

      {/* LIGHTBOX (بسيط بدون مكتبات) */}
      <dialog open={!!active} onClose={() => setActive(null)}>
        {active && (
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{active.title[lang]}</div>

            {active.media.type === "image" && (
              <img src={active.media.src} alt={active.title[lang]} style={{ width: "100%", borderRadius: 8 }} />
            )}

            {active.media.type === "youtube" && (
              <iframe
                style={{ width: "100%", aspectRatio: "16/9", borderRadius: 8 }}
                src={`https://www.youtube.com/embed/${active.media.id}`}
                allowFullScreen
                title="project-youtube"
              />
            )}

            {active.media.type === "vimeo" && (
              <iframe
                style={{ width: "100%", aspectRatio: "16/9", borderRadius: 8 }}
                src={`https://player.vimeo.com/video/${active.media.id}`}
                allowFullScreen
                title="project-vimeo"
              />
            )}

            <p className="muted" style={{ marginTop: 8 }}>{active.description[lang]}</p>

            <div style={{ marginTop: 12, textAlign: "end" }}>
              <button className="btn" onClick={() => setActive(null)}>
                {lang === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
