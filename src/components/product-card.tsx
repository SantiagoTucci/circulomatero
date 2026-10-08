import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/hooks/cart-context";
import { parsePrice } from "@/lib/parse-price";

export function ProductCard({ product }: { product: any }) {
  const { addItem, toggleCart } = useCart();
  const [added, setAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Normalizamos las imágenes: soporta tanto product.images (array) como product.image (string único)
  const images: string[] = Array.isArray(product?.images) && product.images.length > 0
    ? product.images
    : [product?.image || "/placeholder.svg"];

  // 🛠️ Obtenemos la versión numérica real del precio
  const numericPrice = parsePrice(product?.price);

  const handleAdd = () => {
    // 🛠️ Mandamos al carrito el objeto con el precio ya sanitizado como número puro
    addItem({
      ...product,
      price: numericPrice,
    });
    toggleCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 will-change-transform">
      <div className="aspect-square bg-muted relative overflow-hidden">
        {/* Renderizado de la imagen actual con animación suave */}
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImageIndex}
            src={images[currentImageIndex]}
            alt={`${product.name} - Imagen ${currentImageIndex + 1}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
          />
        </AnimatePresence>

        {/* Controles de navegación si hay más de 1 imagen */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 sm:p-1.5 rounded-full backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10"
            >
              <ChevronLeft className="w-6 h-6 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={nextImage}
              aria-label="Siguiente imagen"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 sm:p-1.5 rounded-full backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10"
            >
              <ChevronRight className="w-6 h-6 sm:w-5 sm:h-5" />
            </button>

            {/* Indicadores inferiores (Dots) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Ir a la imagen ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-muted-foreground mb-3 text-sm font-[system-ui]">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          {/* 🛠️ Formateamos sobre numericPrice que garantizamos que es un Number */}
          <span className="text-xl font-bold text-primary">
            $ {numericPrice.toLocaleString("es-AR")}
          </span>
          <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Button
              size="sm"
              onClick={handleAdd}
              className={`rounded-lg font-[system-ui] flex items-center gap-1 !p-3 transition-all ${
                added ? "bg-green-600 text-white hover:!bg-green-200 hover:text-black" : "bg-primary text-white hover:bg-primary/80"
              }`}
            >
              {added ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Agregado
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" /> Agregar
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}