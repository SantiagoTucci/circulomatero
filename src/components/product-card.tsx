import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/cart-context";
import { parsePrice } from "@/lib/parse-price";

export function ProductCard({ product }: { product: any }) {
  const { addItem, toggleCart } = useCart();
  const [added, setAdded] = useState(false);

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

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 will-change-transform mx-2">
      <div className="aspect-square bg-muted relative overflow-hidden">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 will-change-transform"
        />
      </div>
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        <p className="text-muted-foreground mb-4 text-sm font-[system-ui]">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          {/* 🛠️ Formateamos sobre numericPrice que garantizamos que es un Number */}
          <span className="text-2xl font-bold text-primary">
            $ {numericPrice.toLocaleString("es-AR")}
          </span>
          <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Button
              size="lg"
              onClick={handleAdd}
              className={`rounded-lg font-[system-ui] flex items-center gap-1 !p-4 transition-all ${
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