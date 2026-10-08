import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X } from "lucide-react";
import logo from "@/assets/logo/logo.png";
import { useCart } from "@/hooks/cart-context";
import { CartSidebar } from "@/components/cart-sidebar";
import { useNavigate, useLocation, Link } from "react-router-dom";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCart();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const isPedidoPage = location.pathname === "/pedido";

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.getElementById("hero");
      if (heroSection) {
        const heroBottom = heroSection.offsetHeight;
        const scrollPosition = window.scrollY;
        setIsScrolled(scrollPosition > heroBottom - 100);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCheckout = () => {
    setCartOpen(false);
    navigate("/pedido");
  };

  // 🛠️ Función para navegar a la sección y hacer scroll suave sin recargar la página
  const handleNavClick = (hash: string) => {
    setMobileMenuOpen(false);
    if (location.pathname !== "/") {
      navigate("/" + hash);
    } else {
      const element = document.getElementById(hash.replace("#", ""));
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full overflow-x-hidden z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white shadow-md"
          : "bg-gradient-to-b from-[var(--hero-bg-start)] shadow-none"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between overflow-x-hidden">
        {/* Logo -> Usa <Link> hacia "/" en lugar de <a href="/inicio"> */}
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Círculo Matero Logo"
            className={`w-10 h-10 rounded-full object-cover transition-transform duration-300 ${
              isScrolled ? "scale-95" : "scale-100"
            }`}
          />
          <Link
            to="/"
            className={`text-xl font-bold transition-colors ${
              isScrolled ? "text-foreground" : "text-white"
            }`}
          >
            Círculo Matero
          </Link>
        </div>

        {/* Menu Desktop centrado */}
        {!isPedidoPage && (
          <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2 max-w-full overflow-x-hidden">
            <button
              onClick={() => handleNavClick("#productos")}
              className={`text-sm font-medium transition-colors hover:opacity-80 ${
                isScrolled ? "text-foreground" : "text-white"
              }`}
            >
              Productos
            </button>
            <button
              onClick={() => handleNavClick("#nosotros")}
              className={`text-sm font-medium transition-colors hover:opacity-80 ${
                isScrolled ? "text-foreground" : "text-white"
              }`}
            >
              Nosotros
            </button>
            <button
              onClick={() => handleNavClick("#contacto")}
              className={`text-sm font-medium transition-colors hover:opacity-80 ${
                isScrolled ? "text-foreground" : "text-white"
              }`}
            >
              Contacto
            </button>
          </nav>
        )}

        {/* Botones */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className={`relative overflow-x-hidden transition-colors ${
              isScrolled
                ? "text-foreground hover:bg-muted"
                : "text-white hover:bg-white/20"
            }`}
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span
                className={`absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center font-semibold overflow-hidden rounded-full ${
                  isScrolled ? "text-green-800" : "text-white"
                }`}
              >
                {totalItems}
              </span>
            )}
          </Button>

          {!isPedidoPage && (
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden overflow-x-hidden transition-colors ${
                isScrolled
                  ? "text-foreground hover:bg-muted"
                  : "text-white hover:bg-white/20"
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Menú móvil */}
      {!isPedidoPage && mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 w-full overflow-x-hidden bg-white z-50 border-t shadow-md">
          <nav className="container mx-auto px-4 py-4 space-y-3 max-w-full overflow-x-hidden">
            <button
              onClick={() => handleNavClick("#productos")}
              className="block w-full text-left py-2 text-sm font-medium hover:text-primary"
            >
              Productos
            </button>
            <button
              onClick={() => handleNavClick("#nosotros")}
              className="block w-full text-left py-2 text-sm font-medium hover:text-primary"
            >
              Nosotros
            </button>
            <button
              onClick={() => handleNavClick("#contacto")}
              className="block w-full text-left py-2 text-sm font-medium hover:text-primary"
            >
              Contacto
            </button>
          </nav>
        </div>
      )}

      {/* Sidebar Carrito */}
      <CartSidebar
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />
    </header>
  );
}