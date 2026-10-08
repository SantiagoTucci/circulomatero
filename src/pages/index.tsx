import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { getProducts, sampleProducts, normalizeText } from "../../public/productos/productos";
import { Product } from "@/types/product";
import { InfiniteCarousel } from "@/components/infinite-carousel";
import { ProductCard } from "@/components/product-card";
import {
  LazyMotion,
  domAnimation,
  m,
  AnimatePresence,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const location = useLocation();

  const [cat1, setCat1] = useState<string>("Todos");
  const [cat2, setCat2] = useState<string>("Todos");
  const [cat3, setCat3] = useState<string>("Todos");

  const carouselImages = [
    "/carousel-images/messi-mateando.jpg",
    "/carousel-images/mate-auto.jpg",
    "/carousel-images/mate-sur.jpg",
    "/carousel-images/lago-mate.jpg",
    "/carousel-images/dos-manos-mate.webp",
  ];

  useEffect(() => {
    document.body.style.overflowX = "hidden";

    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const element = document.getElementById(targetId);

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }

    return () => {
      document.body.style.overflowX = "";
    };
  }, [location]);

  useEffect(() => {
    let isMounted = true;

    getProducts()
      .then((data) => {
        if (!isMounted) return;
        setProducts(data && data.length > 0 ? data : sampleProducts);
      })
      .catch((err) => {
        console.error("Error al cargar productos dinámicos:", err);
        if (isMounted) setProducts(sampleProducts);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1️⃣ Categoria 1
  const listCat1 = useMemo(() => {
    const categories = products
      .map((p) => p.cat1 || p.type || "")
      .map((v) => v.trim())
      .filter(Boolean);

    const uniqueMap = new Map<string, string>();
    categories.forEach((category) => {
      const normalized = normalizeText(category);
      if (!uniqueMap.has(normalized)) {
        uniqueMap.set(normalized, category);
      }
    });

    return ["Todos", ...Array.from(uniqueMap.values())];
  }, [products]);

  // 2️⃣ Categoria 2 (filtrada estrictamente según Cat1)
  const listCat2 = useMemo(() => {
    if (cat1 === "Todos") return [];

    const selectedCat1 = normalizeText(cat1);
    const productsCat1 = products.filter(
      (p) => normalizeText(p.cat1 || p.type) === selectedCat1
    );

    const uniqueMap = new Map<string, string>();
    productsCat1.forEach((product) => {
      const category = (product.cat2 || product.subcategory || "").trim();
      if (!category) return;

      const normalized = normalizeText(category);
      if (!uniqueMap.has(normalized)) {
        uniqueMap.set(normalized, category);
      }
    });

    const categories = Array.from(uniqueMap.values());
    return categories.length > 0 ? ["Todos", ...categories] : [];
  }, [products, cat1]);

  // 3️⃣ Categoria 3 (filtrada estrictamente según Cat1 y Cat2)
  const listCat3 = useMemo(() => {
    if (cat1 === "Todos" || cat2 === "Todos") return [];

    const selectedCat1 = normalizeText(cat1);
    const selectedCat2 = normalizeText(cat2);

    const productsCat1Cat2 = products.filter((p) => {
      const productCat1 = normalizeText(p.cat1 || p.type);
      const productCat2 = normalizeText(p.cat2 || p.subcategory);
      return productCat1 === selectedCat1 && productCat2 === selectedCat2;
    });

    const uniqueMap = new Map<string, string>();
    productsCat1Cat2.forEach((product) => {
      const category = (product.cat3 || "").trim();
      if (!category) return;

      const normalized = normalizeText(category);
      if (!uniqueMap.has(normalized)) {
        uniqueMap.set(normalized, category);
      }
    });

    const categories = Array.from(uniqueMap.values());
    return categories.length > 0 ? ["Todos", ...categories] : [];
  }, [products, cat1, cat2]);

  const handleCat1Change = (value: string) => {
    setCat1(value);
    setCat2("Todos");
    setCat3("Todos");
  };

  const handleCat2Change = (value: string) => {
    setCat2(value);
    setCat3("Todos");
  };

  const handleCat3Change = (value: string) => {
    setCat3(value);
  };

  // 🔍 Filtrado final estricto
  const filteredProducts = useMemo(() => {
    const selectedCat1 = normalizeText(cat1);
    const selectedCat2 = normalizeText(cat2);
    const selectedCat3 = normalizeText(cat3);

    return products.filter((product) => {
      const productCat1 = normalizeText(product.cat1 || product.type);
      const productCat2 = normalizeText(product.cat2 || product.subcategory);
      const productCat3 = normalizeText(product.cat3);

      const matchCat1 = cat1 === "Todos" || productCat1 === selectedCat1;
      if (!matchCat1) return false;

      const matchCat2 = cat2 === "Todos" || productCat2 === selectedCat2;
      if (!matchCat2) return false;

      const matchCat3 = cat3 === "Todos" || productCat3 === selectedCat3;
      if (!matchCat3) return false;

      return true;
    });
  }, [products, cat1, cat2, cat3]);

  return (
    <LazyMotion features={domAnimation}>
      <m.div className="min-h-screen">
        <Header />
        <Hero />

        <main id="productos" className="container mx-auto px-2 sm:px-4 py-20">
          <m.div
            className="text-center mb-10"
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

          {!loading && (
            <div className="space-y-4 mb-12">
              {/* Nivel 1 */}
              {listCat1.length > 1 && (
                <m.div
                  className="flex flex-wrap justify-center gap-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {listCat1.map((item) => {
                    const selected = normalizeText(cat1) === normalizeText(item);

                    return (
                      <button
                        key={item}
                        onClick={() => handleCat1Change(item)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 font-[system-ui] ${
                          selected
                            ? "bg-primary text-primary-foreground shadow-md scale-105"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </m.div>
              )}

              {/* Nivel 2 */}
              {listCat2.length > 0 && (
                <m.div
                  className="flex flex-wrap justify-center gap-2 pt-2 border-t border-muted/50 max-w-2xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {listCat2.map((item) => {
                    const selected = normalizeText(cat2) === normalizeText(item);

                    return (
                      <button
                        key={item}
                        onClick={() => handleCat2Change(item)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 font-[system-ui] ${
                          selected
                            ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                            : "bg-background text-muted-foreground border border-muted hover:bg-muted/50"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </m.div>
              )}

              {/* Nivel 3 */}
              {listCat3.length > 0 && (
                <m.div
                  className="flex flex-wrap justify-center gap-2 pt-1 max-w-2xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {listCat3.map((item) => {
                    const selected = normalizeText(cat3) === normalizeText(item);

                    return (
                      <button
                        key={item}
                        onClick={() => handleCat3Change(item)}
                        className={`px-3 py-1 rounded-full text-xs font-normal transition-all duration-300 font-[system-ui] ${
                          selected
                            ? "bg-primary/30 text-primary font-semibold"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </m.div>
              )}
            </div>
          )}

          {/* Grid de Productos con animación lateral */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-full">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-muted/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <m.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-full overflow-hidden"
            >
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <m.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <ProductCard product={product} />
                  </m.div>
                ))}
              </AnimatePresence>
            </m.div>
          ) : (
            <m.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center py-16 text-muted-foreground"
            >
              No hay productos disponibles para los filtros seleccionados.
            </m.div>
          )}
        </main>

        {/* Nosotros */}
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
                Somos tres amigos unidos por la pasión y la tradición del mate. Este emprendimiento nació para compartir la calidez, el encuentro y la identidad que el mate simboliza para todos los argentinos, a través de productos de calidad.
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

        {/* Contacto */}
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
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    className="w-full h-full rounded-2xl border-0"
                  />
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
            <p className="text-sm opacity-80">
              © 2026 Círculo Matero. Todos los derechos reservados.
            </p>
          </div>
        </m.footer>
      </m.div>
    </LazyMotion>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.floor(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: "easeOut" });
    return () => controls.stop();
  }, [value]);

  return <m.span>{rounded}</m.span>;
}