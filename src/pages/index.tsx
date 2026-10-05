import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { getProducts, sampleProducts } from "../../public/productos/productos";
import { Product } from "@/types/product";
import { InfiniteCarousel } from "@/components/infinite-carousel";
import { ProductCard } from "@/components/product-card";
import { LazyMotion, domAnimation, m, useMotionValue, useTransform, animate } from "framer-motion";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 🏷️ Estados para categorías principales y subcategorías
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("Todos");

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

  useEffect(() => {
    let isMounted = true;

    getProducts()
      .then((data) => {
        if (isMounted) {
          setProducts(data && data.length > 0 ? data : sampleProducts);
        }
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

  // 1️⃣ Categorías principales únicas (Ej: Todos, Mate, Bombilla, Tela)
  const mainCategories = useMemo(() => {
    const rawCategories = products.map((p) => p.type).filter(Boolean);
    const unique = Array.from(new Set(rawCategories));
    return ["Todos", ...unique];
  }, [products]);

  // 2️⃣ Subcategorías disponibles según la Categoría Principal seleccionada
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === "Todos") return [];

    const filtered = products.filter(
      (p) => p.type?.toLowerCase() === selectedCategory.toLowerCase()
    );

    const subcats = filtered
      .map((p) => p.subcategory)
      .filter((sub): sub is string => Boolean(sub && sub.trim() !== ""));

    const uniqueSubcats = Array.from(new Set(subcats));
    return uniqueSubcats.length > 0 ? ["Todos", ...uniqueSubcats] : [];
  }, [products, selectedCategory]);

  // 3️⃣ Reiniciar la subcategoría cuando cambia la categoría principal
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory("Todos");
  };

  // 4️⃣ Filtrado final de productos
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === "Todos" ||
        product.type?.toLowerCase() === selectedCategory.toLowerCase();

      const matchSubcategory =
        selectedSubcategory === "Todos" ||
        product.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase();

      return matchCategory && matchSubcategory;
    });
  }, [products, selectedCategory, selectedSubcategory]);

  return (
    <LazyMotion features={domAnimation}>
      <m.div className="min-h-screen">
        <Header />
        <Hero />

        {/* 🛍️ Sección de Productos y Filtros */}
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
              {/* Nivel 1: Categorías Principales */}
              <m.div
                className="flex flex-wrap justify-center gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {mainCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 font-[system-ui] ${
                      selectedCategory.toLowerCase() === category.toLowerCase()
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </m.div>

              {/* Nivel 2: Subcategorías (Se muestra solo si hay subcategorías para la categoría elegida) */}
              {availableSubcategories.length > 0 && (
                <m.div
                  className="flex flex-wrap justify-center gap-2 pt-2 border-t border-muted/50 max-w-2xl mx-auto"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  {availableSubcategories.map((subcat) => (
                    <button
                      key={subcat}
                      onClick={() => setSelectedSubcategory(subcat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 font-[system-ui] ${
                        selectedSubcategory.toLowerCase() === subcat.toLowerCase()
                          ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                          : "bg-background text-muted-foreground border border-muted hover:bg-muted/50"
                      }`}
                    >
                      {subcat}
                    </button>
                  ))}
                </m.div>
              )}
            </div>
          )}

          {/* 🧉 Grid de Productos */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-full">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-96 bg-muted/40 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <m.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-full"
            >
              {filteredProducts.map((product) => (
                <m.div key={product.id} layout transition={{ duration: 0.4 }}>
                  <ProductCard product={product} />
                </m.div>
              ))}
            </m.div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              No hay productos disponibles para los filtros seleccionados.
            </div>
          )}
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
                    sandbox="allow-scripts allow-same-origin allow-popups"
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
            <p className="text-sm opacity-80">© 2026 Círculo Matero. Todos los derechos reservados.</p>
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