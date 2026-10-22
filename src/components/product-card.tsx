import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/hooks/cart-context";
import { parsePrice } from "@/lib/parse-price";
import { Product } from "@/types/product"; // 👈 Importás tu interfaz actualizada
import { m } from "framer-motion";

interface ProductCardProps {
  product: Product;
  isFirstProduct?: boolean;
}

export function ProductCard({ product, isFirstProduct = false }: ProductCardProps) {
  const { addItem, toggleCart } = useCart();
  const [added, setAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Normalización de imágenes con fallback seguro
  const images: string[] =
    Array.isArray(product?.images) && product.images.length > 0
      ? product.images
      : [product?.image || "/placeholder.svg"];

  const numericPrice = parsePrice(product?.price);

  // Generador de srcset para las miniaturas optimizadas por Cloudflare Proxy
  const generateSrcSet = (imageUrl: string) => {
    if (!imageUrl) return undefined;

    const driveMatch =
      imageUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/) || imageUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (!driveMatch?.[1]) {
      return undefined;
    }

    const fileId = driveMatch[1];
    return [
      `/api/image-proxy?url=${encodeURIComponent(`https://drive.google.com/thumbnail?id=${fileId}&sz=w300`)} 300w`,
      `/api/image-proxy?url=${encodeURIComponent(`https://drive.google.com/thumbnail?id=${fileId}&sz=w400`)} 400w`,
      `/api/image-proxy?url=${encodeURIComponent(`https://drive.google.com/thumbnail?id=${fileId}&sz=w600`)} 600w`,
    ].join(", ");
  };

  const currentImageSrc = images[currentImageIndex] || "/placeholder.svg";
  const srcSet = generateSrcSet(currentImageSrc);

  const handleAdd = () => {
    addItem({
      ...product,
      price: numericPrice,
      type: product.type || "Otros",          // Garantiza string
      description: product.description || "", // Garantiza string
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
    <div className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 will-change-transform w-full border border-border/50">
      {/* Contenedor de la Imagen con aspect-square para evitar CLS */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        <img
          key={`${product.id}-${currentImageIndex}`}
          src={currentImageSrc}
          srcSet={srcSet}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          alt={`${product.name} - Imagen ${currentImageIndex + 1}`}
          loading={isFirstProduct ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={isFirstProduct ? "high" : "auto"}
          width="400"
          height="400"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
        />

        {/* Controles de navegación si hay múltiples imágenes */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Imagen anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={nextImage}
              aria-label="Siguiente imagen"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-10"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicadores (Dots) */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/30 px-2 py-1 rounded-full backdrop-blur-xs">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Detalle del Producto */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
        <div>
          <h3 className="text-base sm:text-lg font-semibold line-clamp-1 mb-1" title={product.name}>
            {product.name}
          </h3>
          {product.description && (
            <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
          <span className="text-lg sm:text-xl font-bold text-primary">
            $ {numericPrice.toLocaleString("es-AR")}
          </span>
          <m.div whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.03 }} transition={{ duration: 0.15 }}>
            <Button
              size="sm"
              onClick={handleAdd}
              aria-label={added ? `Agregado ${product.name}` : `Agregar ${product.name} al carrito`}
              className={`rounded-lg font-medium flex items-center gap-1.5 px-3 py-2 min-h-[40px] transition-colors ${
                added
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {added ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Agregado</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Agregar</span>
                </>
              )}
            </Button>
          </m.div>
        </div>
      </div>
    </div>
  );
}