import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Mail, User, MapPin, CheckCircle, Phone, Loader2, Package } from "lucide-react"
import { useCart } from "@/hooks/cart-context"
import { toast } from "sonner"
import emailjs from "@emailjs/browser"
import { cn } from "@/lib/utils"
import { Header } from "@/components/header"

interface CheckoutFormProps {
  onBack: () => void
}

export function CheckoutForm({ onBack }: CheckoutFormProps) {
  const { items, clearCart } = useCart()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const navigate = useNavigate()

  const getItemPrice = (item: any) => (item.quantity >= 5 ? item.price * 0.7 : item.price)

  const total = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)

  const totalSavings = items.reduce((sum, item) => {
    if (item.quantity >= 5) {
      return sum + (item.price - getItemPrice(item)) * item.quantity
    }
    return sum
  }, 0)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Por favor completa todos los campos correctamente")
      return
    }

    setIsSubmitting(true)

    try {
      const templateParams = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        items: items
          .map(
            (i) =>
              `${i.name} x${i.quantity} - ${formatPrice(getItemPrice(i))} ${i.quantity >= 5 ? "(Mayorista -30%)" : ""}`,
          )
          .join(", "),
        total: formatPrice(total),
      }

      await emailjs.send("service_wav5fsj", "template_amenbz9", templateParams, "UUWrV55n6pCMnFoQk")

      setIsSuccess(true)
      clearCart()
      toast.success("¡Pedido enviado exitosamente!")
    } catch (error) {
      console.error(error)
      toast.error("Error al enviar el pedido. Intenta nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <>
        <Header />
        <div className="min-h-screen w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="w-full max-w-xl text-center">
            {/* Icono de confirmación */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
              ¡Gracias por tu pedido!
            </h1>

            {/* Descripción */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-8 text-muted-foreground font-[system-ui]">
              Tu pedido ha sido recibido y será procesado pronto.
            </p>

            {/* Card con próximos pasos */}
            <Card className="mb-6 sm:mb-8 border-primary/20 shadow-lg">
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg sm:text-xl mb-2 font-[system-ui]">Próximos pasos:</h3>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-[system-ui]">
                      El seguimiento de tu pedido y la coordinación del pago se realizará por correo electrónico.
                    </p>
                    <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-[system-ui] mt-2">
                      Revisa tu bandeja de entrada en los próximos minutos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botón volver */}
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
              Volver
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
          <Card className="order-1 lg:order-1 border-primary/20 shadow-md bg-card h-fit  overflow-y-auto">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 p-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Información de Contacto</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              {/* Formulario */}
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

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-10 sm:h-11 text-sm sm:text-base font-semibold mt-4 font-[system-ui]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando Pedido...</> : "Confirmar Pedido"}
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

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-2 text-center text-sm text-muted-foreground font-[system-ui]">
                El pago se coordina por correo electrónico
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
