"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/cart-context"
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { parsePrice } from "@/lib/parse-price";

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
}


export function CartSidebar({ isOpen, onClose, onCheckout }: CartSidebarProps) {
  const { items, updateQuantity, removeItem, getTotal } = useCart()

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)

  // 🛠️ Usamos parsePrice para obtener el precio real numérico
  const getItemPrice = (item: any) => {
    const numericPrice = parsePrice(item.price)
    return item.quantity >= 5 ? numericPrice * 0.7 : numericPrice
  }

  // 🛠️ Usamos parsePrice en el cálculo de ahorros
  const totalSavings = items.reduce((sum, item) => {
    const numericPrice = parsePrice(item.price)
    if (item.quantity >= 5) {
      return sum + (numericPrice - getItemPrice(item)) * item.quantity
    }
    return sum
  }, 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            className={cn(
              "fixed top-0 right-0 h-full bg-background shadow-2xl z-50 flex flex-col",
              "w-full sm:w-[440px] md:w-[480px]"
            )}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative border-b bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center justify-between p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Tu Carrito</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground font-[system-ui]">
                      {items.length} {items.length === 1 ? "producto" : "productos"}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-primary/10 rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Products list */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {items.length === 0 ? (
                <motion.div
                  className="flex flex-col items-center justify-center h-full text-center px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Tu carrito está vacío</h3>
                  <p className="text-sm text-muted-foreground mb-6 font-[system-ui]">Agrega productos para comenzar tu pedido</p>
                  <Button onClick={onClose} variant="outline" className="font-[system-ui]">
                    Explorar Productos
                  </Button>
                </motion.div>
              ) : (
                items.map((item, index) => {
                  const numericPrice = parsePrice(item.price)
                  const unitPriceWithDiscount = getItemPrice(item)

                  return (
                    <motion.div
                      key={item.id}
                      className={cn(
                        "group relative border rounded-xl p-3 sm:p-4 bg-card",
                        "hover:shadow-md hover:border-primary/30 transition-all duration-200"
                      )}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {/* Wholesale badge */}
                      {item.quantity >= 5 && (
                        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md z-10">
                          -30%
                        </div>
                      )}

                      <div className="flex gap-3 sm:gap-4">
                        {/* Product image */}
                        {item.image && (
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base text-foreground truncate mb-1">
                            {item.name}
                          </h4>
                          <div className="flex flex-col gap-1 mb-3">
                            <p className="text-xs sm:text-sm text-muted-foreground font-[system-ui]">
                              {formatPrice(numericPrice)} c/u
                            </p>
                            {item.quantity >= 5 && (
                              <p className="text-xs font-medium text-green-600">
                                Precio mayorista: {formatPrice(unitPriceWithDiscount)} c/u
                              </p>
                            )}
                          </div>

                          {/* Quantity controls */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center border rounded-lg overflow-hidden bg-background">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary/10"
                              >
                                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <div className="w-10 sm:w-12 text-center text-sm sm:text-base font-medium font-[system-ui]">
                                {item.quantity}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-primary/10"
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </div>

                            {/* Price and delete */}
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm sm:text-base text-foreground">
                                {formatPrice(unitPriceWithDiscount * item.quantity)}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeItem(item.id)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t bg-gradient-to-t from-primary/5 to-transparent">
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Savings indicator */}
                  {totalSavings > 0 && (
                    <motion.div
                      className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-lg">🎉</span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-green-800">
                        Ahorraste {formatPrice(totalSavings)} con precios mayoristas
                      </p>
                    </motion.div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg sm:text-xl font-semibold text-muted-foreground">Total:</span>
                    <span className="text-2xl sm:text-3xl font-bold text-foreground">{formatPrice(getTotal())}</span>
                  </div>

                  {/* Checkout button */}
                  <Button
                    className={cn(
                      "w-full h-12 sm:h-12 text-base sm:text-sm font-semibold",
                      "bg-gradient-to-r from-primary",
                      "hover:from-primary/10 hover:to-primary/10",
                      "shadow-lg hover:shadow-xl transition-all duration-200 font-[system-ui]"
                    )}
                    onClick={onCheckout}
                    disabled={items.length === 0}
                  >
                    Confirmar Pedido
                  </Button>

                  <p className="text-xs text-center text-muted-foreground mb-7 sm:mb-0 font-[system-ui]">
                    El pago se coordina por correo electrónico
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}