const ENLACE = `https://wa.me/50672930517?text=${encodeURIComponent("Hola, quiero información sobre Intervallum.")}`;

export function BotonWhatsapp() {
  return (
    <a
      href={ENLACE}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp (se abre en una pestaña nueva)"
      title="Escríbenos por WhatsApp"
      className="group fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full bg-[#25D366] p-4 text-white shadow-lg transition hover:shadow-xl"
    >
      <span className="hidden text-sm font-medium group-hover:inline">Escríbenos</span>
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19.1L4 20z" />
        <path d="M9 9.5c.3 2.2 2.3 4.2 4.5 4.5l1-1 1.8.8-.4 1.6c-3.6.2-7-3.2-6.8-6.8l1.6-.4.8 1.8-1 1z" />
      </svg>
    </a>
  );
}
