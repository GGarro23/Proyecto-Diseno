"use client";

import { useMemo, useState } from "react";

// Intervallum: prototipo visual público. Productos y precios de demostración.
// No requiere dependencias nuevas: solo Next.js, React y Tailwind CSS.
type Category = "Todos" | "Guitarras" | "Teclados" | "Bajos" | "Accesorios";

type Product = {
  id: number;
  name: string;
  category: Exclude<Category, "Todos">;
  description: string;
  price: number;
  image: string;
  label?: string;
};

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Guitarra acústica Aurora",
    category: "Guitarras",
    description: "Un sonido cálido para tus primeras canciones.",
    price: 89900,
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=900&q=85&fit=crop",
    label: "Favorito",
  },
  {
    id: 2,
    name: "Teclado digital Nova 61",
    category: "Teclados",
    description: "Versatilidad para explorar nuevas melodías.",
    price: 149900,
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=900&q=85&fit=crop",
    label: "Nuevo",
  },
  {
    id: 3,
    name: "Bajo eléctrico Horizonte",
    category: "Bajos",
    description: "Un ritmo con personalidad propia.",
    price: 179900,
    image: "https://images.unsplash.com/photo-1511196044526-5cb3bcb7071b?w=900&q=85&fit=crop",
  },
  {
    id: 4,
    name: "Audífonos de estudio Pulse",
    category: "Accesorios",
    description: "Escuchá cada detalle de tu música.",
    price: 34900,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=85&fit=crop",
    label: "Destacado",
  },
  {
    id: 5,
    name: "Guitarra eléctrica Vertex",
    category: "Guitarras",
    description: "Para riffs que no pasan desapercibidos.",
    price: 219900,
    image: "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=900&q=85&fit=crop",
  },
  {
    id: 6,
    name: "Micrófono de estudio Echo",
    category: "Accesorios",
    description: "Capturá ideas con claridad.",
    price: 59900,
    image: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=900&q=85&fit=crop",
  },
];

const CATEGORIES: {
  name: Exclude<Category, "Todos">;
  subtitle: string;
  image: string;
  symbol: string;
}[] = [
  {
    name: "Guitarras",
    subtitle: "Encontrá tu sonido",
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=75&fit=crop",
    symbol: "♫",
  },
  {
    name: "Teclados",
    subtitle: "Cada nota cuenta",
    image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&q=75&fit=crop",
    symbol: "♬",
  },
  {
    name: "Bajos",
    subtitle: "Sentí el ritmo",
    image: "https://images.unsplash.com/photo-1511196044526-5cb3bcb7071b?w=800&q=75&fit=crop",
    symbol: "♪",
  },
  {
    name: "Accesorios",
    subtitle: "Los detalles importan",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=75&fit=crop",
    symbol: "✦",
  },
];

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: "search" | "cart" | "user" | "arrow" | "plus" | "menu" | "close" | "minus" | "check";
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
  };
  const paths: Record<typeof name, React.ReactNode> = {
    search: <><circle cx="10.8" cy="10.8" r="6.7" /><path d="m16 16 5 5" /></>,
    cart: <><path d="M3 4h2l2.2 11.5h11.9l2-8.5H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.5 3-7 8-7s8 2.5 8 7" /></>,
    arrow: <><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="M5 5l14 14M19 5 5 19" /></>,
    minus: <path d="M5 12h14" />,
    check: <path d="m4 12 5 5L20 6" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const crc = (value: number) => `₡${new Intl.NumberFormat("es-CR").format(value)}`;

export default function HomePage() {
  const [category, setCategory] = useState<Category>("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("es");
    return PRODUCTS.filter((product) => {
      const matchesCategory = category === "Todos" || category === product.category;
      const matchesSearch = !q || `${product.name} ${product.category} ${product.description}`.toLocaleLowerCase("es").includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [category, search]);

  const cartItems = PRODUCTS.filter((product) => (cart[product.id] ?? 0) > 0);
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const total = cartItems.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0);

  const setQuantity = (id: number, quantity: number) => {
    setCart((previous) => ({ ...previous, [id]: Math.max(0, quantity) }));
  };
  const chooseCategory = (next: Category) => {
    setCategory(next);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#10213a]">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a1d35] text-white shadow-lg shadow-[#0a1d35]/10">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center gap-5 px-5 sm:px-8 lg:px-12">
          <a href="#inicio" className="flex shrink-0 items-center gap-3" onClick={() => chooseCategory("Todos")} aria-label="Intervallum, volver al inicio">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#13c2b6]/15 text-[#39e0d1]">
              <svg viewBox="0 0 44 44" className="h-8 w-8" fill="none" aria-hidden="true">
                <path d="M4 22h3m3-7v14m5-22v30m5-20v10m5-19v28m5-22v16m5-11v6m5-7v4" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight sm:text-2xl">Intervallum<span className="text-[#ffbe51]">.</span></span>
          </a>

          <nav className="ml-4 hidden items-center gap-7 text-sm font-semibold lg:flex" aria-label="Navegación principal">
            <a href="#inicio" onClick={() => chooseCategory("Todos")} className="border-b-2 border-[#ffbe51] py-2 text-white">Inicio</a>
            <a href="#catalogo" onClick={() => chooseCategory("Todos")} className="py-2 text-slate-300 transition hover:text-white">Instrumentos</a>
            <a href="#catalogo" onClick={() => chooseCategory("Accesorios")} className="py-2 text-slate-300 transition hover:text-white">Accesorios</a>
            <a href="#nosotros" className="py-2 text-slate-300 transition hover:text-white">Nosotros</a>
          </nav>

          <div className="ml-auto hidden max-w-[290px] flex-1 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 lg:flex">
            <Icon name="search" className="h-4 w-4 text-slate-300" />
            <input
              aria-label="Buscar productos"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar instrumentos..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
            />
            <a href="#catalogo" className="sr-only">Ver resultados</a>
          </div>

          <button onClick={() => setAccountOpen(true)} className="hidden rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 sm:flex" type="button">
            Mi cuenta
          </button>
          <button onClick={() => setCartOpen(true)} aria-label={`Abrir carrito, ${count} artículos`} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/25 transition hover:bg-white/10" type="button">
            <Icon name="cart" />
            {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#ffbe51] px-1 text-[11px] font-bold text-[#0a1d35]">{count}</span>}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 lg:hidden" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} type="button">
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
        {menuOpen && (
          <nav className="space-y-1 border-t border-white/10 px-5 py-4 text-sm lg:hidden" aria-label="Navegación móvil">
            <a href="#inicio" onClick={() => chooseCategory("Todos")} className="block rounded-lg px-4 py-3 hover:bg-white/10">Inicio</a>
            <a href="#catalogo" onClick={() => chooseCategory("Todos")} className="block rounded-lg px-4 py-3 hover:bg-white/10">Instrumentos</a>
            <a href="#catalogo" onClick={() => chooseCategory("Accesorios")} className="block rounded-lg px-4 py-3 hover:bg-white/10">Accesorios</a>
            <a href="#nosotros" onClick={() => setMenuOpen(false)} className="block rounded-lg px-4 py-3 hover:bg-white/10">Nosotros</a>
          </nav>
        )}
      </header>

      <main id="inicio">
        {/* Hero editorial: tipografía protagonista, imagen musical y ondas */}
        <section className="relative isolate overflow-hidden bg-[#0b1e37] text-white">
          <div className="absolute inset-0 bg-cover bg-[center_40%] opacity-55" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1800&q=90&fit=crop')" }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07172f] via-[#092647]/95 to-[#08243b]/25" />
          <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-[#0bd0c0]/25 blur-3xl" />
          <div className="relative mx-auto grid min-h-[490px] max-w-[1440px] items-center px-5 py-20 sm:px-8 lg:min-h-[525px] lg:px-12">
            <div className="max-w-2xl">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#4cdbc8]/50 bg-[#13c2b6]/15 px-4 py-2 text-xs font-bold uppercase tracking-[.17em] text-[#7af3e4]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6ef7dd]" /> Viví la música a tu manera
              </span>
              <h1 className="text-4xl font-extrabold leading-[1.07] tracking-tight sm:text-6xl lg:text-[72px]">
                Tu próxima historia<br />comienza con <span className="font-serif italic text-[#ffbe51]">música.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-200 sm:text-lg">
                Instrumentos, accesorios y nuevas formas de crear. Encontrá eso que hace que cada nota sea tuya.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#catalogo" onClick={() => chooseCategory("Todos")} className="inline-flex items-center gap-3 rounded-xl bg-[#ffbe51] px-6 py-3.5 text-sm font-extrabold text-[#0a1d35] shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-[#ffd07b]">
                  Explorar catálogo <Icon name="arrow" className="h-4 w-4" />
                </a>
                <a href="#categorias" className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15">
                  Ver categorías
                </a>
              </div>
              <div className="mt-10 flex items-center gap-3 text-sm text-slate-300">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#13c2b6]/25 text-[#78f8e5]"><Icon name="check" className="h-4 w-4" /></span>
                <span>Elegí, explorá y encontrá tu próximo instrumento.</span>
              </div>
            </div>
          </div>
          <svg viewBox="0 0 1440 62" className="absolute bottom-0 left-0 h-[42px] w-full text-[#f6f8fb] sm:h-[62px]" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 44 C250 -12 400 74 690 33 S1165 -5 1440 30 L1440 62 L0 62 Z" fill="currentColor" />
            <path d="M0 18 C280 85 400 -5 720 35 S1155 73 1440 12" stroke="#0fe3c7" strokeOpacity=".55" strokeWidth="2" fill="none" />
          </svg>
        </section>

        {/* Categorías */}
        <section id="categorias" className="scroll-mt-24 mx-auto max-w-[1440px] px-5 pb-6 pt-14 sm:px-8 lg:px-12">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[.2em] text-[#078e89]">Encontrá tu sonido</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Explorá por categoría<span className="text-[#10a79f]">.</span></h2>
            </div>
            <a href="#catalogo" onClick={() => chooseCategory("Todos")} className="inline-flex items-center gap-2 text-sm font-bold text-[#0e7490] hover:underline">Ver todos los productos <Icon name="arrow" className="h-4 w-4" /></a>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
            {CATEGORIES.map((item) => (
              <a
                key={item.name}
                href="#catalogo"
                onClick={() => chooseCategory(item.name)}
                className="group relative isolate min-h-[175px] overflow-hidden rounded-2xl bg-[#0e2740] p-5 text-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:min-h-[215px] sm:p-6"
              >
                <div className="absolute inset-0 bg-cover bg-center opacity-65 transition duration-500 group-hover:scale-110" style={{ backgroundImage: `url('${item.image}')` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061a2f] via-[#071e34]/30 to-transparent" />
                <div className="relative flex h-full flex-col justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/15 text-2xl backdrop-blur-sm">{item.symbol}</span>
                  <div>
                    <p className="text-lg font-bold sm:text-xl">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-200 sm:text-sm">{item.subtitle}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Catálogo de demostración */}
        <section id="catalogo" className="scroll-mt-24 mx-auto max-w-[1440px] px-5 pb-16 pt-12 sm:px-8 lg:px-12">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-[.2em] text-[#078e89]">Nuestra selección</span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Instrumentos que inspiran<span className="text-[#10a79f]">.</span></h2>
              <p className="mt-2 text-sm text-[#64748b]">Productos y precios ilustrativos para el prototipo.</p>
            </div>
            <div className="relative w-full md:hidden">
              <Icon name="search" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar productos..." aria-label="Buscar productos en el catálogo" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm outline-none focus:border-[#0abbb3]" />
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2" aria-label="Filtrar productos por categoría">
            {(["Todos", "Guitarras", "Teclados", "Bajos", "Accesorios"] as Category[]).map((item) => (
              <button key={item} type="button" onClick={() => chooseCategory(item)} aria-pressed={category === item} className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${category === item ? "bg-[#0c2f4c] text-white shadow-md" : "border border-slate-200 bg-white text-slate-600 hover:border-[#0db1a7] hover:text-[#087f79]"}`}>
                {item}
              </button>
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
              <p className="text-lg font-bold">No encontramos productos con esos filtros.</p>
              <p className="mt-2 text-sm text-slate-500">Probá otra búsqueda o volvé a ver todo el catálogo.</p>
              <button type="button" onClick={() => { setSearch(""); setCategory("Todos"); }} className="mt-5 rounded-xl bg-[#0b2b46] px-5 py-3 text-sm font-bold text-white">Ver todos</button>
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProducts.map((product) => (
                <article key={product.id} className="group overflow-hidden rounded-[22px] border border-[#e5eaf0] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#123451]/10">
                  <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 sm:h-60">
                    <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${product.image}')` }} role="img" aria-label={product.name} />
                    {product.label && <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-extrabold text-[#0a3146] shadow-sm">{product.label}</span>}
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#0b9a91]">{product.category}</p>
                    <h3 className="mt-1 text-xl font-bold leading-snug">{product.name}</h3>
                    <p className="mt-2 min-h-10 text-sm leading-relaxed text-slate-500">{product.description}</p>
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
                      <span className="text-2xl font-extrabold tracking-tight text-[#10213a]">{crc(product.price)}</span>
                      <button type="button" onClick={() => setQuantity(product.id, (cart[product.id] ?? 0) + 1)} aria-label={`Agregar ${product.name} al carrito`} className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b2b46] text-white transition hover:bg-[#0d968f] active:scale-95">
                        <Icon name="plus" className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Bloque editorial secundario */}
        <section id="nosotros" className="scroll-mt-24 bg-[#0c2340] text-white">
          <div className="relative mx-auto grid max-w-[1440px] overflow-hidden px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-12 lg:px-12 lg:py-20">
            <div className="relative z-10 max-w-xl">
              <span className="text-xs font-extrabold uppercase tracking-[.2em] text-[#6beedc]">Hecho para quienes aman crear</span>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-5xl">La música comienza con una idea. <span className="font-serif italic text-[#ffbe51]">Hacéla sonar.</span></h2>
              <p className="mt-5 leading-relaxed text-slate-300">Intervallum es un espacio pensado para explorar instrumentos y descubrir nuevas posibilidades musicales.</p>
              <a href="#catalogo" onClick={() => chooseCategory("Todos")} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#ffbe51] px-6 py-3.5 text-sm font-extrabold text-[#0a1d35] transition hover:bg-[#ffd27b]">
                Descubrir productos <Icon name="arrow" className="h-4 w-4" />
              </a>
            </div>
            <div className="relative mt-10 h-56 overflow-hidden rounded-3xl border border-white/10 bg-[#152e47] lg:mt-0 lg:h-72">
              <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=1100&q=85&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#09233d]/60 to-transparent" />
              <span className="absolute bottom-5 left-6 font-serif text-xl italic text-white">Encontrá tu ritmo.</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#08182b] px-5 py-10 text-slate-300 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 border-b border-white/10 pb-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xl font-extrabold text-white">Intervallum<span className="text-[#ffbe51]">.</span></p>
            <p className="mt-1 text-sm">Tu próxima historia comienza con música.</p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-semibold">
            <a href="#inicio" className="hover:text-white">Inicio</a>
            <a href="#categorias" className="hover:text-white">Categorías</a>
            <a href="#catalogo" className="hover:text-white">Catálogo</a>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-2 pt-6 text-xs text-slate-400 sm:flex-row">
          <span>© {new Date().getFullYear()} Intervallum · Prototipo académico</span>
          <span>Productos, imágenes y precios utilizados para demostración.</span>
        </div>
      </footer>

      {/* Carrito interactivo de demostración */}
      {cartOpen && (
        <div className="fixed inset-0 z-50" role="presentation">
          <button type="button" aria-label="Cerrar carrito" className="absolute inset-0 bg-[#07172b]/65 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} />
          <aside role="dialog" aria-modal="true" aria-label="Carrito de compras" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div><h2 className="text-2xl font-extrabold">Tu carrito</h2><p className="text-sm text-slate-500">{count} {count === 1 ? "producto" : "productos"}</p></div>
              <button type="button" onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 hover:bg-slate-200" aria-label="Cerrar carrito"><Icon name="close" /></button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-5">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="grid h-20 w-20 place-items-center rounded-3xl bg-[#e8f8f6] text-[#078e89]"><Icon name="cart" className="h-9 w-9" /></span>
                  <h3 className="mt-5 text-xl font-bold">Tu carrito está vacío</h3>
                  <p className="mt-2 text-sm text-slate-500">Explorá los instrumentos y agregá tus favoritos.</p>
                  <button type="button" onClick={() => setCartOpen(false)} className="mt-6 rounded-xl bg-[#0b2b46] px-5 py-3 text-sm font-bold text-white">Seguir explorando</button>
                </div>
              ) : (
                <div className="space-y-5">
                  {cartItems.map((product) => (
                    <div key={product.id} className="flex gap-4 border-b border-slate-100 pb-5">
                      <div className="h-20 w-20 shrink-0 rounded-xl bg-cover bg-center bg-slate-100" style={{ backgroundImage: `url('${product.image}')` }} role="img" aria-label={product.name} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold leading-snug">{product.name}</p>
                        <p className="mt-1 text-sm font-extrabold text-[#098d85]">{crc(product.price)}</p>
                        <div className="mt-2 inline-flex items-center rounded-lg border border-slate-200">
                          <button type="button" onClick={() => setQuantity(product.id, (cart[product.id] ?? 0) - 1)} className="px-2.5 py-1.5" aria-label={`Quitar una unidad de ${product.name}`}><Icon name="minus" className="h-4 w-4" /></button>
                          <span className="min-w-6 text-center text-sm font-bold">{cart[product.id]}</span>
                          <button type="button" onClick={() => setQuantity(product.id, (cart[product.id] ?? 0) + 1)} className="px-2.5 py-1.5" aria-label={`Agregar una unidad de ${product.name}`}><Icon name="plus" className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="border-t border-slate-200 bg-[#f8fafc] px-6 py-6">
                <div className="mb-4 flex items-center justify-between"><span className="text-slate-600">Subtotal ilustrativo</span><span className="text-2xl font-extrabold">{crc(total)}</span></div>
                <p className="mb-4 rounded-xl bg-[#e8f8f6] p-3 text-xs leading-relaxed text-[#17655e]">Este carrito es una demostración de interfaz. No se están realizando compras ni cobros reales.</p>
                <button type="button" disabled className="w-full cursor-not-allowed rounded-xl bg-slate-300 px-5 py-3.5 text-sm font-extrabold text-slate-600" title="Checkout pendiente de implementación">Finalizar compra · Próximamente</button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Acceso a cuenta: mensaje informativo, sin fingir autenticación */}
      {accountOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#07172b]/65 px-5" role="presentation" onClick={() => setAccountOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Acceso de usuarios" className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e9f7f6] text-[#078e89]"><Icon name="user" className="h-7 w-7" /></span>
            <h2 className="mt-4 text-2xl font-extrabold">Mi cuenta</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">El acceso de usuarios se implementará en otra etapa. Por ahora estás viendo la portada pública del prototipo.</p>
            <button type="button" onClick={() => setAccountOpen(false)} className="mt-6 w-full rounded-xl bg-[#0b2b46] px-5 py-3 text-sm font-bold text-white">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}
