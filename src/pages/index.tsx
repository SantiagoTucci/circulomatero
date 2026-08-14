import { useEffect } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Instagram } from "lucide-react";
import { sampleProducts } from "../../public/productos/productos";
import { InfiniteCarousel } from "@/components/infinite-carousel";
import { ProductCard } from "@/components/product-card";
import { motion, LazyMotion, domAnimation, m, useMotionValue, useTransform, animate } from "framer-motion";

export default function Home() {
  const carouselImages = [
    "/carousel-images/messi-mateando.jpg",
    "/carousel-images/mate-auto.jpg",
    "/carousel-images/mate-sur.jpg",
    "/carousel-images/lago-mate.jpg",
    "/carousel-images/dos-manos-mate.webp",
  ];

  useEffect(() => {
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = "";
    };
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <m.div className="min-h-screen">
        <Header />
        <Hero />

        {/* 🛍️ Productos */}
        <main id="productos" className="container mx-auto px-2 sm:px-4 py-20">
          <m.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 gradient-text">
              Nuestra Colección
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty font-[system-ui]">
              Cada mate es una pieza única, elaborada con materiales nobles y técnicas tradicionales.
            </p>
          </m.div>

          {/* 🧉 Grid de productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-full">
            {sampleProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </main>

        {/* 🧉 Sección Nosotros */}
        <section id="nosotros" className="bg-muted/30 py-25">
          <div className="container mx-auto px-2 sm:px-4">
            <m.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <h2 className="text-4xl font-bold mb-6 gradient-text">Nuestra Historia</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8 text-pretty">
                Somos tres amigos unidos por la pasión y la tradición del mate. Este emprendimiento nació para compartir
                la calidez, el encuentro y la identidad que el mate simboliza para todos los argentinos, a través de
                productos de calidad.
              </p>

              <m.div
                className="overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <InfiniteCarousel images={carouselImages} speed={40} />
              </m.div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-12">
                {[
                  { value: 1, suffix: "+", label: "Año de experiencia" },
                  { value: 3, suffix: "", label: "Amigos y fundadores" },
                  { value: 50, suffix: "+", label: "Clientes felices" },
                  { value: 100, suffix: "%", label: "Artesanal y de calidad" },
                ].map((item, index) => (
                  <m.div
                    key={index}
                    className="text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2, duration: 0.6 }}
                    viewport={{ once: true }}
                  >
                    <div className="text-4xl font-bold text-primary mb-2">
                      <AnimatedNumber value={item.value} />
                      {item.suffix}
                    </div>
                    <div className="text-muted-foreground">{item.label}</div>
                  </m.div>
                ))}
              </div>
            </m.div>
          </div>
        </section>

        {/* 💬 Sección Contacto */}
        <section id="contacto" className="py-25 text-background">
          <div className="container mx-auto px-4">
            <m.div
              className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <m.div
                className="w-full md:w-1/2 text-center md:text-left order-first md:order-1"
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
              >
                <h2 className="text-4xl font-bold mb-6 gradient-text">Contactanos</h2>
                <p className="text-lg text-muted-foreground mb-8 text-pretty">
                  ¿Tenés alguna duda? Escribinos y te respondemos.
                </p>

                <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center md:justify-start mb-8">
                  <a
                    href="https://wa.me/5491161706060"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-xl shadow-lg hover:scale-105 font-[system-ui] transition-transform bg-green-800 hover:bg-white hover:!text-black px-5 py-4 text-lg font-semibold"
                  >
                    WhatsApp
                  </a>
                  <a
                    href="https://www.instagram.com/circulomatero.ok/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-xl bg-white !text-black font-[system-ui] hover:!text-white shadow-lg hover:scale-105 hover:bg-green-800 transition-transform px-5 py-4 text-lg font-semibold"
                  >
                    Instagram
                  </a>
                </div>

                <m.div
                  className="hidden md:flex justify-center mt-10"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  viewport={{ once: true }}
                >
                  <img
                    src="/carousel-images/instagram-feed.png"
                    alt="Instagram Círculo Matero"
                    loading="lazy"
                    className="w-100 xl:w-120 max-w-full h-auto transition-all duration-300 hover:-translate-y-2 drop-shadow-lg shadow-sm hover:shadow-xl rounded-2xl overflow-hidden will-change-transform"
                  />
                </m.div>
              </m.div>

              {/* Video de TikTok */}
              <m.div
                className="w-full md:w-1/2 flex justify-center order-last md:order-2"
                initial={{ opacity: 0, x: -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-full max-w-xs sm:max-w-sm md:max-w-md aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl">
                  <iframe
                    src="https://www.tiktok.com/embed/7556644757905198392"
                    allowFullScreen
                    title="Video de Círculo Matero"
                    className="w-full h-full rounded-2xl border-0"
                  ></iframe>
                </div>
              </m.div>
            </m.div>
          </div>
        </section>

        {/* Footer */}
        <m.footer
          className="bg-foreground text-background py-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <div className="container mx-auto px-4 text-center space-y-4">
            <p className="text-sm opacity-80">© 2025 Círculo Matero. Todos los derechos reservados.</p>
           {/*  <div className="flex items-center justify-center gap-2">
              <span className="text-sm opacity-80">Hecho por</span>
              <a
                href="https://www.instagram.com/tucciwebstudio"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:opacity-100 opacity-80 transition"
              >
                <Instagram className="w-4 h-4" />
                <span className="text-md font-semibold">Tucci Web Studio</span>
              </a>
            </div>*/}
          </div>
        </m.footer>
      </m.div>
    </LazyMotion>
  );
}

// Animated numbers optimizados
function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, latest => Math.floor(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return () => controls.stop();
  }, [value]);

  return <m.span>{rounded}</m.span>;
}
