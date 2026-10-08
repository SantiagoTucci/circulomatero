import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, User, MapPin, CheckCircle, Phone, Package, MessageCircle } from "lucide-react"
import { useCart } from "@/hooks/cart-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"

interface CheckoutFormProps {
  onBack: () => void
}

// 📱 CONFIGURACIÓN: Tu número de WhatsApp con código de país (Ej: Argentina +54 9 1161706060 -> 5491161706060)
const WHATSAPP_PHONE_NUMBER = "5491171812001"

export function CheckoutForm({ onBack }: CheckoutFormProps) {
  const { items, clearCart } = useCart()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const navigate = useNavigate()

  const getItemPrice = (item: any) => (item.quantity >= 5 ? item.price * 0.7 : item.price)

  const total = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Correo electrónico inválido"
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido"
    }

    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Por favor completa todos los campos correctamente")
      return
    }

    // 📝 1. Armamos el detalle de los productos
    const itemsListText = items
      .map(
        (i) =>
          `• *${i.name}* x${i.quantity} - ${formatPrice(getItemPrice(i) * i.quantity)}${
            i.quantity >= 5 ? " _(Desc. Mayorista)_" : ""
          }`
      )
      .join("\n")

    // 💬 2. Armamos el mensaje completo formateado para WhatsApp
    const message = `*Pedido desde la Web!* 🧉\n\n` +
      `*Cliente:* ${formData.name}\n` +
      `*Teléfono:* ${formData.phone}\n` +
      `*Email:* ${formData.email}\n` +
      `*Dirección:* ${formData.address}\n\n` +
      `*DETALLE DEL PEDIDO:*\n${itemsListText}\n\n` +
      `*TOTAL:* ${formatPrice(total)}`

    // 🔗 3. Abrimos la URL de WhatsApp
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")

    setIsSuccess(true)
    clearCart()
    toast.success("¡Pedido enviado a WhatsApp!")
  }

  if (isSuccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="w-full max-w-xl text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              ¡Gracias por tu pedido!
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 text-muted-foreground font-[system-ui]">
              Se ha abierto una pestaña de WhatsApp con los detalles de tu pedido.
            </p>

            <Card className="mb-6 sm:mb-8 border-primary/20 shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg sm:text-xl mb-2 font-[system-ui]">Coordinación directa:</h3>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-[system-ui]">
                      Presiona enviar en el chat de WhatsApp para ponernos en contacto y coordinar la entrega y el pago.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={onBack}
              size="lg"
              className={cn(
                "w-full sm:w-full md:w-auto h-10 sm:h-12 md:h-12 text-sm sm:text-base md:text-lg font-semibold",
                "bg-gradient-to-r from-primary",
                "hover:from-primary/10 hover:to-primary/10",
                "shadow-lg hover:shadow-xl transition-all duration-200 font-[system-ui]"
              )}
            >
              Volver al Inicio
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header />
      <div className="mt-16 w-full p-3 lg:p-6 flex flex-col overflow-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/inicio")}
          className="mb-3 sm:mb-4 self-start hover:bg-primary text-sm font-[system-ui]"
        >
          <ArrowLeft className="h-3 w-3 mr-2" />
          Volver
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 max-w-6xl mx-auto w-full flex-1">
          {/* Información personal */}
          <Card className="order-1 lg:order-1 border-primary/20 shadow-md bg-card h-fit overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Información de Contacto</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {/* Nombre */}
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm font-[system-ui]">Nombre Completo</Label>
                  <div className="relative">
                    <User className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      className={cn("pl-9 h-9 text-sm font-[system-ui]", errors.name && "border-destructive focus-visible:ring-destructive")}
                      value={formData.name}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }))
                        setErrors(prev => ({ ...prev, name: "" }))
                      }}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-destructive font-[system-ui]">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-sm font-[system-ui]">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className={cn("pl-9 h-9 text-sm font-[system-ui]", errors.email && "border-destructive focus-visible:ring-destructive")}
                      value={formData.email}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, email: e.target.value }))
                        setErrors(prev => ({ ...prev, email: "" }))
                      }}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive font-[system-ui]">{errors.email}</p>}
                </div>

                {/* Teléfono */}
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-sm font-[system-ui]">Número de Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+54 11 1234-5678"
                      className={cn("pl-9 h-9 text-sm font-[system-ui]", errors.phone && "border-destructive focus-visible:ring-destructive")}
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, phone: e.target.value }))
                        setErrors(prev => ({ ...prev, phone: "" }))
                      }}
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-destructive font-[system-ui]">{errors.phone}</p>}
                </div>

                {/* Dirección */}
                <div className="space-y-1">
                  <Label htmlFor="address" className="text-sm font-[system-ui]">Dirección de Entrega</Label>
                  <div className="relative">
                    <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="Calle, número, ciudad"
                      className={cn("pl-9 h-9 text-sm font-[system-ui]", errors.address && "border-destructive focus-visible:ring-destructive")}
                      value={formData.address}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, address: e.target.value }))
                        setErrors(prev => ({ ...prev, address: "" }))
                      }}
                    />
                  </div>
                  {errors.address && <p className="text-xs text-destructive font-[system-ui]">{errors.address}</p>}
                </div>

                {/* Submit por WhatsApp */}
                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold mt-4 font-[system-ui] bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" /> Enviar Pedido por WhatsApp
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resumen del pedido */}
          <Card className="order-2 lg:order-2 border-primary/20 bg-card lg:sticky lg:top-4 mb-10 sm:mb-0">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 p-3 rounded-t-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Resumen del Pedido</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm transition-colors">
                    {item.image && (
                      <div className="relative w-12 h-12 sm:w-16 sm:h-15 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover" />
                        {item.quantity >= 5 && (
                          <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-1 py-0.5 rounded-bl">-30%</div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground font-[system-ui]">{item.quantity} x {formatPrice(getItemPrice(item))}</p>
                      {item.quantity >= 5 && <p className="text-xs font-medium text-green-600">Precio mayorista</p>}
                    </div>
                    <span className="font-bold text-sm">{formatPrice(getItemPrice(item) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between items-center py-1.5">
                <span className="text-xl font-semibold text-muted-foreground">Total:</span>
                <span className="text-xl font-bold text-foreground">{formatPrice(total)}</span>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center text-sm text-green-700 font-[system-ui]">
                El pedido se enviará directamente a nuestro WhatsApp
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}