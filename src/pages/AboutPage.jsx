import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function AboutPage() {
  useDocumentTitle('Sobre mí', {
    description: 'Conoce la voz detrás de Letras de Paz: un espacio de poesía sobre la nostalgia, la cotidianidad y las emociones que nos conectan.',
  });
  return (
    <main className="max-w-6xl mx-auto px-10 page-padding py-8 md:py-10 animate-fade-in">
      <section className="grid lg:grid-cols-[0.82fr_1.18fr] gap-8 lg:gap-10 items-center">
        <div className="relative animate-fade-in-up">
          <div className="aspect-[4/5] overflow-hidden rounded-[8px] border border-border bg-white p-2 shadow-[0_34px_90px_-55px_rgba(31,37,32,0.72)]">
            <img
              src="/assets/Porfile.jpg"
              alt="Poeta de Letras de Paz frente a un micrófono"
              className="h-full w-full rounded-[6px] object-cover object-center"
            />
          </div>
          <div className="absolute -bottom-5 right-5 rounded-[8px] bg-sage text-parchment px-5 py-4 shadow-[0_20px_48px_-30px_rgba(31,37,32,0.85)]">
            <p className="font-poem text-2xl leading-none">Letras de Paz</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] opacity-80">Voz y memoria</p>
          </div>
        </div>

        <div className="animate-fade-in-up delay-2">
          <p className="text-[11px] tracking-[0.2em] uppercase text-sage font-semibold font-sans mb-4">
            Sobre mí
          </p>
          <h1 className="font-poem text-[48px] md:text-[68px] font-semibold text-ink leading-[0.96] mb-8">
            La voz detrás de las letras
          </h1>
          <div className="editorial-rule mb-8" />

          <div className="space-y-6 text-ink-light">
            <p className="font-poem text-[24px] leading-9">
              Bienvenidos a este rincón de calma. Soy un tejedor de palabras que encuentra en la poesía una forma de respirar más profundo.
            </p>
            <p className="font-poem text-[24px] leading-9">
              Letras de Paz nació de la necesidad de crear un espacio alejado del ruido constante del mundo moderno. Un lugar donde los silencios importan tanto como las palabras, y donde los sentimientos complejos pueden encontrar un hogar sencillo.
            </p>
            <p className="font-poem text-[24px] leading-9">
              Mis versos exploran la nostalgia, los pequeños detalles de la cotidianidad y las emociones universales que nos conectan en la distancia. Creo que un poema no está terminado hasta que alguien lo lee y lo hace suyo.
            </p>
            <p className="font-poem text-xl italic text-ink-muted">
              Gracias por detenerte a leer. Espero que encuentres en estos poemas un refugio, o al menos, un momento de quietud.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-evenly">
            {[
              { name: 'X', url: 'https://x.com/hugopazrojas1', img: '/assets/X.png', imgAlt: 'X (Twitter)' },
              { name: 'Instagram', url: 'https://instagram.com/hugopazrojas', img: '/assets/Instagram.png', imgAlt: 'Instagram' },
              { name: 'Facebook', url: 'https://facebook.com/hugopazrojas', img: '/assets/Facebook.png', imgAlt: 'Facebook' },
            ].map(({ name, url, img, imgAlt }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-none px-4 py-2.5 text-sm font-medium transition-colors duration-300 no-underline flex items-center gap-3 bg-transparent hover:bg-transparent"
                aria-label={name}
              >
                <img src={img} alt={imgAlt} className="w-8 h-8 object-contain" />
                <span>{name}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
