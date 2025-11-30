import { useState, memo } from 'react';
import { useSupabase } from '@/context/SupabaseContext';
import { PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { validateZelleEmail, validateZellePhone } from '@/lib/accounts/utils';

// Import modular components
import { SalesHeader } from '@/components/sales/SalesHeader';
import { ProductsGrid } from '@/components/sales/ProductsGrid';
import { ShoppingCart } from '@/components/sales/ShoppingCart';
import { PaymentDialog } from '@/components/sales/PaymentDialog';
import { CashClosureDialog } from '@/components/sales/CashClosureDialog';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  priceUSD: number;
  priceVES: number;
}

interface CashClosure {
  id: string;
  date: string;
  totalSales: number;
  totalUSD: number;
  totalVES: number;
  salesCount: number;
  createdAt: string;
}

function Sales() {
  const { state, addSale, clearSales } = useSupabase();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('usd');
  const [paidUSD, setPaidUSD] = useState<string>('');
  const [paidVES, setPaidVES] = useState<string>('');
  const [reference, setReference] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [zelleEmail, setZelleEmail] = useState('');
  const [zellePhone, setZellePhone] = useState('');
  const [isProcessingDialogOpen, setIsProcessingDialogOpen] = useState(false);
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);

  const addToCart = (productId: string) => {
    const product = state.products.find(p => p.id === productId);
    if (!product || product.stock <= 0) {
      toast.error('Producto no disponible');
      return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('No hay suficiente stock');
        return;
      }
      setCart(prev => prev.map(item =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart(prev => [...prev, {
        productId,
        productName: product.name,
        quantity: 1,
        priceUSD: product.priceUSD,
        priceVES: product.priceVES
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = state.products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      toast.error('No hay suficiente stock');
      return;
    }

    setCart(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const calculateTotals = () => {
    const totalUSD = cart.reduce((sum, item) => sum + (item.priceUSD * item.quantity), 0);
    const totalVES = cart.reduce((sum, item) => sum + (item.priceVES * item.quantity), 0);
    return { totalUSD, totalVES };
  };

  const calculateDailySummary = () => {
    const today = new Date().toDateString();
    const todaySales = state.sales.filter(sale => {
      const saleDate = new Date(sale.createdAt).toDateString();
      return today === saleDate;
    });

    const totalUSD = todaySales.reduce((sum, sale) => sum + sale.totalUSD, 0);
    const totalVES = todaySales.reduce((sum, sale) => sum + sale.totalVES, 0);
    const salesCount = todaySales.length;

    return { totalUSD, totalVES, salesCount, sales: todaySales };
  };

  const validatePaymentData = (): boolean => {
    if (paymentMethod === 'mixed') {
      const paidUSDNum = parseFloat(paidUSD) || 0;
      const paidVESNum = parseFloat(paidVES) || 0;
      
      if (paidUSDNum <= 0 && paidVESNum <= 0) {
        toast.error('Debe ingresar al menos un monto para pago mixto');
        return false;
      }
    }

    if (paymentMethod === 'zelle') {
      if (!zelleEmail && !zellePhone) {
        toast.error('Debe ingresar email o teléfono para Zelle');
        return false;
      }
      
      if (zelleEmail && !validateZelleEmail(zelleEmail)) {
        toast.error('Email de Zelle inválido');
        return false;
      }
      
      if (zellePhone && !validateZellePhone(zellePhone)) {
        toast.error('Teléfono de Zelle inválido (formato: +58-XXX-XXX-XXXX)');
        return false;
      }
    }

    return true;
  };

  const handleProcessSale = async () => {
    console.log('🔍 SALES DEBUG - Starting sale process...');
    console.log('🔍 SALES DEBUG - Current user state:', state.user);
    console.log('🔍 SALES DEBUG - User exists:', !!state.user);
    console.log('🔍 SALES DEBUG - User ID:', state.user?.id);
    console.log('🔍 SALES DEBUG - User name:', state.user?.name);
    console.log('🔍 SALES DEBUG - Cart items:', cart);
    
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (!state.user) {
      console.error('❌ SALES ERROR - Usuario no autenticado - state.user is:', state.user);
      
      const savedUser = localStorage.getItem('sales-app-user');
      console.log('🔍 SALES DEBUG - Saved user in localStorage:', savedUser);
      
      if (savedUser) {
        console.log('🔍 SALES DEBUG - Found user in localStorage, but not in state. This is the issue!');
        toast.error('Error de sesión - Por favor recarga la página');
      } else {
        toast.error('Debe iniciar sesión para procesar ventas');
      }
      return;
    }

    if (!state.user.id) {
      console.error('❌ SALES ERROR - Usuario sin ID:', state.user);
      toast.error('Error: Usuario sin ID válido');
      return;
    }

    if (!state.user.name) {
      console.error('❌ SALES ERROR - Usuario sin nombre:', state.user);
      toast.error('Error: Usuario sin nombre válido');
      return;
    }

    if (!validatePaymentData()) {
      return;
    }

    const { totalUSD, totalVES } = calculateTotals();
    
    try {
      const saleData = {
        items: cart,
        paymentMethod,
        totalUSD,
        totalVES,
        userId: state.user.id,
        userName: state.user.name,
        ...(paymentMethod === 'mixed' && {
          paidUSD: parseFloat(paidUSD) || 0,
          paidVES: parseFloat(paidVES) || 0
        }),
        ...(paymentMethod === 'zelle' && {
          zelleEmail: zelleEmail || undefined,
          zellePhone: zellePhone || undefined
        }),
        ...(reference && { reference }),
        ...(lastFourDigits && { lastFourDigits })
      };

      console.log('🔍 SALES DEBUG - Sale data to be sent:', saleData);

      await addSale(saleData);
      
      setCart([]);
      setPaymentMethod('usd');
      setPaidUSD('');
      setPaidVES('');
      setReference('');
      setLastFourDigits('');
      setZelleEmail('');
      setZellePhone('');
      setIsProcessingDialogOpen(false);
      
      console.log('✅ SALES DEBUG - Sale processed successfully');
      toast.success('Venta procesada exitosamente');
    } catch (error) {
      console.error('❌ SALES ERROR - Error in handleProcessSale:', error);
      toast.error('Error procesando la venta');
    }
  };

  const handleCashClosure = async () => {
    const summary = calculateDailySummary();
    
    if (summary.salesCount === 0) {
      toast.error('No hay ventas para cerrar');
      return;
    }

    try {
      const closures = JSON.parse(localStorage.getItem('cashClosures') || '[]');
      const newClosure: CashClosure = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        totalSales: summary.salesCount,
        totalUSD: summary.totalUSD,
        totalVES: summary.totalVES,
        salesCount: summary.salesCount,
        createdAt: new Date().toISOString()
      };
      
      closures.push(newClosure);
      localStorage.setItem('cashClosures', JSON.stringify(closures));

      if (clearSales) {
        await clearSales();
      }
      
      setIsClosureDialogOpen(false);
      toast.success(`Caja cerrada: ${summary.salesCount} ventas, $${summary.totalUSD.toFixed(2)} USD, Bs. ${summary.totalVES.toLocaleString()} VES`);
    } catch (error) {
      console.error('❌ DEBUGGING - Error in handleCashClosure:', error);
      toast.error('Error cerrando la caja');
    }
  };

  const { totalUSD, totalVES } = calculateTotals();
  const dailySummary = calculateDailySummary();

  return (
    <div className="space-y-8">
      <SalesHeader 
        cartItemsCount={cart.length}
        onOpenCashClosure={() => setIsClosureDialogOpen(true)}
      />

      {/* Two Column Layout: Products (2 cols) + Cart (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Grid */}
        <div className="lg:col-span-2">
          <ProductsGrid 
            products={state.products}
            onAddToCart={addToCart}
          />
        </div>

        {/* Shopping Cart */}
        <div className="lg:col-span-1">
          <ShoppingCart 
            cart={cart}
            onRemoveFromCart={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onOpenProcessDialog={() => setIsProcessingDialogOpen(true)}
            totalUSD={totalUSD}
            totalVES={totalVES}
          />
        </div>
      </div>

      <PaymentDialog 
        isOpen={isProcessingDialogOpen}
        onOpenChange={setIsProcessingDialogOpen}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        paidUSD={paidUSD}
        onPaidUSDChange={setPaidUSD}
        paidVES={paidVES}
        onPaidVESChange={setPaidVES}
        reference={reference}
        onReferenceChange={setReference}
        lastFourDigits={lastFourDigits}
        onLastFourDigitsChange={setLastFourDigits}
        zelleEmail={zelleEmail}
        onZelleEmailChange={setZelleEmail}
        zellePhone={zellePhone}
        onZellePhoneChange={setZellePhone}
        totalUSD={totalUSD}
        totalVES={totalVES}
        onConfirmSale={handleProcessSale}
        onCancel={() => setIsProcessingDialogOpen(false)}
      />

      <CashClosureDialog 
        isOpen={isClosureDialogOpen}
        onOpenChange={setIsClosureDialogOpen}
        dailySummary={dailySummary}
        onConfirmClosure={handleCashClosure}
        onCancel={() => setIsClosureDialogOpen(false)}
      />
    </div>
  );
}

export default memo(Sales);
