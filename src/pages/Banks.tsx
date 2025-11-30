import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/context/SupabaseContext';
import { FuturisticCard } from '@/components/ui/futuristic-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Building2,
  Plus,
  CreditCard,
  Smartphone,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Hash,
  Calendar,
  Banknote,
  Receipt,
  RefreshCw,
  Download
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { BankAccount, BankTransaction, ExchangeRate } from '@/types/banks';
import { 
  exchangeRateManager, 
  getCurrentExchangeRate, 
  updateExchangeRate, 
  formatVES, 
  formatUSD 
} from '@/lib/exchange-rate';
import { updateExchangeRateFromAPI } from '@/lib/exchange-rate-apis';
import {
  loadBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  loadBankTransactions,
  createBankTransaction,
  getCurrentExchangeRateFromSupabase,
  createExchangeRate,
  getBankingStats,
  testBanksConnection
} from '@/lib/banks-supabase';

type AccountType = 'pago_movil' | 'zelle' | 'transferencia';
type Currency = 'VES' | 'USD';
type TransactionType = 'income' | 'expense';
type PaymentMethodType = 'pago_movil' | 'zelle' | 'transferencia' | 'efectivo';

export default function Banks() {
  const { state } = useSupabase();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isCreateTransactionOpen, setIsCreateTransactionOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [activeTab, setActiveTab] = useState('accounts');
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  
  // New states for View and Edit functionality
  const [isViewAccountOpen, setIsViewAccountOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // New state for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [accountForm, setAccountForm] = useState({
    name: '',
    accountNumber: '',
    accountType: 'pago_movil' as AccountType,
    currency: 'VES' as Currency,
    balance: 0,
    isActive: true,
    bankCode: '',
    phone: '',
    email: ''
  });

  const [transactionForm, setTransactionForm] = useState({
    accountId: '',
    type: 'income' as TransactionType,
    amount: 0,
    reference: '',
    description: '',
    paymentMethod: 'pago_movil' as PaymentMethodType,
    phoneNumber: '',
    bankCode: '',
    zelleEmail: '',
    zellePhone: ''
  });

  const [exchangeRateForm, setExchangeRateForm] = useState({
    usdToVes: 0,
    source: 'Manual'
  });

  const [bankingStats, setBankingStats] = useState({
    totalVES: 0,
    totalUSD: 0,
    totalAccounts: 0,
    activeAccounts: 0,
    todayTransactions: 0,
    todayIncome: 0
  });

  useEffect(() => {
    loadData();
    
    // Listen for exchange rate updates
    const handleExchangeRateUpdate = (event: CustomEvent) => {
      setExchangeRate(event.detail);
      setExchangeRateForm({
        usdToVes: event.detail.usdToVes,
        source: event.detail.source
      });
    };

    window.addEventListener('exchangeRateUpdated', handleExchangeRateUpdate as EventListener);
    
    return () => {
      window.removeEventListener('exchangeRateUpdated', handleExchangeRateUpdate as EventListener);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Test Supabase connection first
      const connected = await testBanksConnection();
      setIsSupabaseConnected(connected);
      
      if (connected) {
        console.log('🏦 Loading data from Supabase...');
        
        // Load data from Supabase
        const [accountsData, transactionsData, currentRate, stats] = await Promise.all([
          loadBankAccounts(),
          loadBankTransactions(),
          getCurrentExchangeRateFromSupabase(),
          getBankingStats()
        ]);
        
        setAccounts(accountsData);
        setTransactions(transactionsData);
        
        if (currentRate) {
          setExchangeRate(currentRate);
          setExchangeRateForm({
            usdToVes: currentRate.usdToVes,
            source: currentRate.source
          });
        } else {
          // Fallback to local exchange rate
          const localRate = getCurrentExchangeRate();
          if (localRate) {
            setExchangeRate(localRate);
            setExchangeRateForm({
              usdToVes: localRate.usdToVes,
              source: localRate.source
            });
          }
        }
        
        if (stats) {
          setBankingStats(stats);
        }
        
        console.log(`✅ Loaded ${accountsData.length} accounts and ${transactionsData.length} transactions from Supabase`);
        toast.success('Datos cargados desde Supabase');
      } else {
        console.log('⚠️ Supabase not connected - using fallback data');
        
        // Load fallback exchange rate
        const currentRate = getCurrentExchangeRate();
        if (currentRate) {
          setExchangeRate(currentRate);
          setExchangeRateForm({
            usdToVes: currentRate.usdToVes,
            source: currentRate.source
          });
        }
        
        // Load mock data as fallback
        const mockAccounts: BankAccount[] = [
          {
            id: '1',
            name: 'Banco de Venezuela - Pago Móvil',
            accountNumber: '01020123456789',
            accountType: 'pago_movil',
            currency: 'VES',
            balance: 2650.00,
            isActive: true,
            bankCode: '0102',
            phone: '04141234567',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Zelle Business Account',
            accountNumber: 'zelle@business.com',
            accountType: 'zelle',
            currency: 'USD',
            balance: 850.75,
            isActive: true,
            email: 'zelle@business.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        const mockTransactions: BankTransaction[] = [
          {
            id: '1',
            accountId: '1',
            saleId: 'sale_1',
            type: 'income',
            amount: 450.00,
            currency: 'VES',
            reference: 'PM240924001',
            description: 'Venta - Cliente Juan Pérez',
            paymentMethod: 'pago_movil',
            phoneNumber: '04241234567',
            bankCode: '0102',
            createdAt: new Date().toISOString()
          },
          {
            id: '2',
            accountId: '2',
            saleId: 'sale_2',
            type: 'income',
            amount: 125.50,
            currency: 'USD',
            reference: 'ZL240924001',
            description: 'Venta - Cliente María González',
            paymentMethod: 'zelle',
            zelleEmail: 'maria@email.com',
            createdAt: new Date().toISOString()
          }
        ];

        setAccounts(mockAccounts);
        setTransactions(mockTransactions);
        
        // Calculate local stats
        const totalVES = mockAccounts.filter(a => a.currency === 'VES').reduce((sum, a) => sum + a.balance, 0);
        const totalUSD = mockAccounts.filter(a => a.currency === 'USD').reduce((sum, a) => sum + a.balance, 0);
        const todayTransactions = mockTransactions.filter(t => {
          const today = new Date().toDateString();
          const transactionDate = new Date(t.createdAt).toDateString();
          return today === transactionDate;
        });
        const todayIncome = todayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

        setBankingStats({
          totalVES,
          totalUSD,
          totalAccounts: mockAccounts.length,
          activeAccounts: mockAccounts.filter(a => a.isActive).length,
          todayTransactions: todayTransactions.length,
          todayIncome
        });
        
        toast.info('Usando datos locales - Configura Supabase para persistencia');
      }
    } catch (error) {
      toast.error('Error cargando datos bancarios');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!accountForm.name) {
      toast.error('Complete los campos requeridos');
      return;
    }

    try {
      if (isSupabaseConnected) {
        // Create in Supabase
        const newAccount = await createBankAccount({
          name: accountForm.name,
          accountNumber: accountForm.accountNumber,
          accountType: accountForm.accountType,
          currency: accountForm.currency,
          balance: accountForm.balance,
          isActive: accountForm.isActive,
          bankCode: accountForm.bankCode || undefined,
          phone: accountForm.phone || undefined,
          email: accountForm.email || undefined
        });

        if (newAccount) {
          setAccounts(prev => [newAccount, ...prev]);
          setIsCreateAccountOpen(false);
          resetAccountForm();
          // Reload stats
          const stats = await getBankingStats();
          if (stats) setBankingStats(stats);
        }
      } else {
        // Fallback to local storage
        const newAccount: BankAccount = {
          id: Date.now().toString(),
          name: accountForm.name,
          accountNumber: accountForm.accountNumber,
          accountType: accountForm.accountType,
          currency: accountForm.currency,
          balance: accountForm.balance,
          isActive: accountForm.isActive,
          bankCode: accountForm.bankCode || undefined,
          phone: accountForm.phone || undefined,
          email: accountForm.email || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        setAccounts(prev => [newAccount, ...prev]);
        setIsCreateAccountOpen(false);
        resetAccountForm();
        toast.success('Cuenta bancaria creada localmente');
      }
    } catch (error) {
      toast.error('Error creando cuenta bancaria');
      console.error(error);
    }
  };

  const handleCreateTransaction = async () => {
    if (!transactionForm.accountId || !transactionForm.amount || !transactionForm.reference) {
      toast.error('Complete los campos requeridos');
      return;
    }

    try {
      const account = accounts.find(a => a.id === transactionForm.accountId);
      if (!account) {
        toast.error('Cuenta no encontrada');
        return;
      }

      if (isSupabaseConnected) {
        // Create in Supabase
        const newTransaction = await createBankTransaction({
          accountId: transactionForm.accountId,
          type: transactionForm.type,
          amount: transactionForm.amount,
          currency: account.currency,
          reference: transactionForm.reference,
          description: transactionForm.description,
          paymentMethod: transactionForm.paymentMethod,
          phoneNumber: transactionForm.phoneNumber || undefined,
          bankCode: transactionForm.bankCode || undefined,
          zelleEmail: transactionForm.zelleEmail || undefined,
          zellePhone: transactionForm.zellePhone || undefined
        });

        if (newTransaction) {
          setTransactions(prev => [newTransaction, ...prev]);
          setIsCreateTransactionOpen(false);
          resetTransactionForm();
          
          // Reload accounts and stats (balance updated by trigger)
          const [accountsData, stats] = await Promise.all([
            loadBankAccounts(),
            getBankingStats()
          ]);
          setAccounts(accountsData);
          if (stats) setBankingStats(stats);
        }
      } else {
        // Fallback to local storage
        const newTransaction: BankTransaction = {
          id: Date.now().toString(),
          accountId: transactionForm.accountId,
          type: transactionForm.type,
          amount: transactionForm.amount,
          currency: account.currency,
          reference: transactionForm.reference,
          description: transactionForm.description,
          paymentMethod: transactionForm.paymentMethod,
          phoneNumber: transactionForm.phoneNumber || undefined,
          bankCode: transactionForm.bankCode || undefined,
          zelleEmail: transactionForm.zelleEmail || undefined,
          zellePhone: transactionForm.zellePhone || undefined,
          createdAt: new Date().toISOString()
        };

        setTransactions(prev => [newTransaction, ...prev]);
        
        // Update account balance locally
        setAccounts(prev => prev.map(acc => 
          acc.id === transactionForm.accountId 
            ? { 
                ...acc, 
                balance: transactionForm.type === 'income' 
                  ? acc.balance + transactionForm.amount 
                  : acc.balance - transactionForm.amount 
              }
            : acc
        ));

        setIsCreateTransactionOpen(false);
        resetTransactionForm();
        toast.success('Transacción registrada localmente');
      }
    } catch (error) {
      toast.error('Error registrando transacción');
      console.error(error);
    }
  };

  const handleUpdateExchangeRate = async () => {
    try {
      setIsUpdatingRate(true);

      if (exchangeRateForm.source === 'Manual') {
        // Manual update
        if (exchangeRateForm.usdToVes <= 0) {
          toast.error('La tasa de cambio debe ser mayor a 0');
          return;
        }

        if (isSupabaseConnected) {
          // Create in Supabase
          const newRate = await createExchangeRate({
            usdToVes: exchangeRateForm.usdToVes,
            source: exchangeRateForm.source
          });

          if (newRate) {
            setExchangeRate(newRate);
          }
        } else {
          // Fallback to local
          const updatedRate = updateExchangeRate(exchangeRateForm.usdToVes, exchangeRateForm.source);
          setExchangeRate(updatedRate);
          toast.success('Tasa de cambio actualizada localmente');
        }
      } else {
        // API update
        const result = await updateExchangeRateFromAPI(exchangeRateForm.source);
        
        if (result.success && result.rate) {
          setExchangeRateForm(prev => ({
            ...prev,
            usdToVes: result.rate!
          }));
        }
      }
    } catch (error) {
      toast.error('Error actualizando tasa de cambio');
      console.error(error);
    } finally {
      setIsUpdatingRate(false);
    }
  };

  // New functions for View and Edit functionality
  const handleViewAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsViewAccountOpen(true);
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setAccountForm({
      name: account.name,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      currency: account.currency,
      balance: account.balance,
      isActive: account.isActive,
      bankCode: account.bankCode || '',
      phone: account.phone || '',
      email: account.email || ''
    });
    setIsEditAccountOpen(true);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || !accountForm.name) {
      toast.error('Complete los campos requeridos');
      return;
    }

    try {
      const updatedAccountData: BankAccount = {
        ...editingAccount,
        name: accountForm.name,
        accountNumber: accountForm.accountNumber,
        accountType: accountForm.accountType,
        currency: accountForm.currency,
        balance: accountForm.balance,
        isActive: accountForm.isActive,
        bankCode: accountForm.bankCode || undefined,
        phone: accountForm.phone || undefined,
        email: accountForm.email || undefined,
        updatedAt: new Date().toISOString()
      };

      if (isSupabaseConnected) {
        // Update in Supabase
        const updatedAccount = await updateBankAccount(updatedAccountData);

        if (updatedAccount) {
          setAccounts(prev => prev.map(acc => 
            acc.id === editingAccount.id ? updatedAccount : acc
          ));
          setIsEditAccountOpen(false);
          setEditingAccount(null);
          resetAccountForm();
          
          // Reload stats
          const stats = await getBankingStats();
          if (stats) setBankingStats(stats);
        }
      } else {
        // Fallback to local
        setAccounts(prev => prev.map(acc => 
          acc.id === editingAccount.id ? updatedAccountData : acc
        ));
        setIsEditAccountOpen(false);
        setEditingAccount(null);
        resetAccountForm();
        toast.success('Cuenta bancaria actualizada localmente');
      }
    } catch (error) {
      toast.error('Error actualizando cuenta bancaria');
      console.error(error);
    }
  };

  // New function for delete functionality
  const handleDeleteAccount = (account: BankAccount) => {
    setAccountToDelete(account);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      setIsDeleting(true);

      if (isSupabaseConnected) {
        // Delete from Supabase
        const success = await deleteBankAccount(accountToDelete.id);

        if (success) {
          setAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));
          setIsDeleteDialogOpen(false);
          setAccountToDelete(null);
          
          // Reload stats
          const stats = await getBankingStats();
          if (stats) setBankingStats(stats);
        }
      } else {
        // Delete locally
        const hasTransactions = transactions.some(t => t.accountId === accountToDelete.id);
        
        if (hasTransactions) {
          toast.error('No se puede eliminar la cuenta porque tiene transacciones asociadas');
          return;
        }

        setAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));
        setIsDeleteDialogOpen(false);
        setAccountToDelete(null);
        toast.success('Cuenta bancaria eliminada localmente');
      }
    } catch (error) {
      toast.error('Error eliminando cuenta bancaria');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetAccountForm = () => {
    setAccountForm({
      name: '',
      accountNumber: '',
      accountType: 'pago_movil',
      currency: 'VES',
      balance: 0,
      isActive: true,
      bankCode: '',
      phone: '',
      email: ''
    });
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      accountId: '',
      type: 'income',
      amount: 0,
      reference: '',
      description: '',
      paymentMethod: 'pago_movil',
      phoneNumber: '',
      bankCode: '',
      zelleEmail: '',
      zellePhone: ''
    });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAccount = accountFilter === 'all' || transaction.accountId === accountFilter;
      return matchesSearch && matchesAccount;
    });
  }, [transactions, searchTerm, accountFilter]);

  const formatCurrency = (amount: number, currency: 'VES' | 'USD') => {
    return currency === 'VES' ? formatVES(amount) : formatUSD(amount);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'pago_movil': return Smartphone;
      case 'zelle': return Mail;
      case 'transferencia': return Building2;
      default: return CreditCard;
    }
  };

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'pago_movil': return 'Pago Móvil';
      case 'zelle': return 'Zelle';
      case 'transferencia': return 'Transferencia';
      default: return type;
    }
  };

  const handleAccountTypeChange = (value: string) => {
    setAccountForm(prev => ({ ...prev, accountType: value as AccountType }));
  };

  const handleCurrencyChange = (value: string) => {
    setAccountForm(prev => ({ ...prev, currency: value as Currency }));
  };

  const handleTransactionTypeChange = (value: string) => {
    setTransactionForm(prev => ({ ...prev, type: value as TransactionType }));
  };

  const handlePaymentMethodChange = (value: string) => {
    setTransactionForm(prev => ({ ...prev, paymentMethod: value as PaymentMethodType }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">
            Gestión Bancaria
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administra cuentas bancarias, pagos móviles y transacciones en VES/USD
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={`px-3 py-1 ${
            isSupabaseConnected 
              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
              : 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
          }`}>
            {isSupabaseConnected ? '🟢 Supabase' : '🟡 Local'}
          </Badge>
          <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
            <DollarSign className="h-4 w-4 mr-2" />
            Tasa: {exchangeRate?.usdToVes?.toFixed(2) || '0.00'} Bs/$
          </Badge>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: 'Total VES',
            value: formatCurrency(bankingStats.totalVES, 'VES'),
            icon: Banknote,
            gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
            color: 'text-blue-600'
          },
          {
            title: 'Total USD',
            value: formatCurrency(bankingStats.totalUSD, 'USD'),
            icon: DollarSign,
            gradient: 'bg-gradient-to-br from-green-500 to-green-600',
            color: 'text-green-600'
          },
          {
            title: 'Cuentas Activas',
            value: `${bankingStats.activeAccounts}/${bankingStats.totalAccounts}`,
            icon: Building2,
            gradient: 'bg-gradient-to-br from-purple-500 to-purple-600',
            color: 'text-purple-600'
          },
          {
            title: 'Transacciones Hoy',
            value: bankingStats.todayTransactions.toString(),
            icon: TrendingUp,
            gradient: 'bg-gradient-to-br from-orange-500 to-orange-600',
            color: 'text-orange-600'
          }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <FuturisticCard variant="glass" className="p-6 flowi-card">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.gradient} shadow-flowi`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                  {stat.value}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {stat.title}
                </p>
              </div>
            </FuturisticCard>
          </motion.div>
        ))}
      </div>

      {/* Exchange Rate Update */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <FuturisticCard variant="glass" className="p-6 flowi-card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-orange-500" />
            Tasa de Cambio USD/VES
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Tasa USD a VES</Label>
              <Input
                type="number"
                step="0.01"
                value={exchangeRateForm.usdToVes}
                onChange={(e) => setExchangeRateForm(prev => ({ ...prev, usdToVes: parseFloat(e.target.value) || 0 }))}
                placeholder="36.50"
                className="flowi-input"
                disabled={exchangeRateForm.source !== 'Manual'}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Fuente</Label>
              <Select value={exchangeRateForm.source} onValueChange={(value) => setExchangeRateForm(prev => ({ ...prev, source: value }))}>
                <SelectTrigger className="flowi-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="BCV">BCV</SelectItem>
                  <SelectItem value="Dólar paralelo">Dólar paralelo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Tasa Actual</Label>
              <div className="flowi-input p-2 dark:bg-gray-800 flex h-10 w-full border border-input text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono bg-[#00000000] rounded-[6px] font-medium text-center opacity-100 text-[#EA580C]">
                {exchangeRate?.usdToVes?.toFixed(2) || '0.00'} Bs/$
              </div>
            </div>
            
            <Button 
              onClick={handleUpdateExchangeRate} 
              className="flowi-button"
              disabled={isUpdatingRate || (exchangeRateForm.source === 'Manual' && exchangeRateForm.usdToVes <= 0)}
            >
              {isUpdatingRate ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {exchangeRateForm.source === 'Manual' ? 'Actualizar Tasa' : `Obtener de ${exchangeRateForm.source}`}
            </Button>
          </div>
          
          {exchangeRate && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Última actualización: {new Date(exchangeRate.createdAt).toLocaleString('es-ES')} 
                - Fuente: {exchangeRate.source}
              </p>
            </div>
          )}
        </FuturisticCard>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-md flowi-button">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Cuenta Bancaria</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la Cuenta *</Label>
                  <Input
                    value={accountForm.name}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Banco Venezuela - Pago Móvil"
                    className="flowi-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Número de Cuenta</Label>
                  <Input
                    value={accountForm.accountNumber}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    placeholder="Ej: 01020123456789"
                    className="flowi-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Cuenta</Label>
                  <Select value={accountForm.accountType} onValueChange={handleAccountTypeChange}>
                    <SelectTrigger className="flowi-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                      <SelectItem value="zelle">Zelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select value={accountForm.currency} onValueChange={handleCurrencyChange}>
                    <SelectTrigger className="flowi-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VES">Bolívares (VES)</SelectItem>
                      <SelectItem value="USD">Dólares (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Balance Inicial</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="flowi-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado de la Cuenta</Label>
                  <Select value={accountForm.isActive ? 'active' : 'inactive'} onValueChange={(value) => setAccountForm(prev => ({ ...prev, isActive: value === 'active' }))}>
                    <SelectTrigger className="flowi-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="inactive">Inactiva</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {accountForm.accountType === 'pago_movil' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código del Banco</Label>
                    <Input
                      value={accountForm.bankCode}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, bankCode: e.target.value }))}
                      placeholder="Ej: 0102"
                      className="flowi-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={accountForm.phone}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Ej: 04141234567"
                      className="flowi-input"
                    />
                  </div>
                </div>
              )}

              {accountForm.accountType === 'zelle' && (
                <div className="space-y-2">
                  <Label>Email de Zelle</Label>
                  <Input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Ej: zelle@business.com"
                    className="flowi-input"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateAccountOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateAccount}
                  className="flex-1 flowi-button"
                >
                  Crear Cuenta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateTransactionOpen} onOpenChange={setIsCreateTransactionOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-orange-200 bg-white hover:bg-orange-50 hover:text-orange-600 text-orange-600 flowi-button-outline">
              <Receipt className="h-4 w-4 mr-2" />
              Nueva Transacción
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Transacción</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cuenta *</Label>
                  <Select value={transactionForm.accountId} onValueChange={(value) => setTransactionForm(prev => ({ ...prev, accountId: value }))}>
                    <SelectTrigger className="flowi-input">
                      <SelectValue placeholder="Seleccionar cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={transactionForm.type} onValueChange={handleTransactionTypeChange}>
                    <SelectTrigger className="flowi-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Ingreso</SelectItem>
                      <SelectItem value="expense">Egreso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Monto *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={transactionForm.amount}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    className="flowi-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Referencia *</Label>
                  <Input
                    value={transactionForm.reference}
                    onChange={(e) => setTransactionForm(prev => ({ ...prev, reference: e.target.value }))}
                    placeholder="Ej: PM240924001"
                    className="flowi-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción de la transacción"
                  className="flowi-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={transactionForm.paymentMethod} onValueChange={handlePaymentMethodChange}>
                  <SelectTrigger className="flowi-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {transactionForm.paymentMethod === 'pago_movil' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={transactionForm.phoneNumber}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="04241234567"
                      className="flowi-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Código del Banco</Label>
                    <Input
                      value={transactionForm.bankCode}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, bankCode: e.target.value }))}
                      placeholder="0102"
                      className="flowi-input"
                    />
                  </div>
                </div>
              )}

              {transactionForm.paymentMethod === 'zelle' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email Zelle</Label>
                    <Input
                      type="email"
                      value={transactionForm.zelleEmail}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, zelleEmail: e.target.value }))}
                      placeholder="cliente@email.com"
                      className="flowi-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Teléfono Zelle</Label>
                    <Input
                      value={transactionForm.zellePhone}
                      onChange={(e) => setTransactionForm(prev => ({ ...prev, zellePhone: e.target.value }))}
                      placeholder="+1234567890"
                      className="flowi-input"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateTransactionOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateTransaction}
                  className="flex-1 flowi-button"
                >
                  Registrar Transacción
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Account Modal */}
      <Dialog open={isViewAccountOpen} onOpenChange={setIsViewAccountOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Cuenta</DialogTitle>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la Cuenta</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    {selectedAccount.name}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Número de Cuenta</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border font-mono">
                    {selectedAccount.accountNumber}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Cuenta</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    {getAccountTypeName(selectedAccount.accountType)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    {selectedAccount.currency === 'VES' ? 'Bolívares (VES)' : 'Dólares (USD)'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Balance</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border font-bold text-orange-600">
                    {formatCurrency(selectedAccount.balance, selectedAccount.currency)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    <Badge className={selectedAccount.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                      {selectedAccount.isActive ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </div>
                </div>
              </div>

              {selectedAccount.phone && (
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border font-mono">
                    {selectedAccount.phone}
                  </div>
                </div>
              )}

              {selectedAccount.email && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border font-mono">
                    {selectedAccount.email}
                  </div>
                </div>
              )}

              {selectedAccount.bankCode && (
                <div className="space-y-2">
                  <Label>Código del Banco</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border font-mono">
                    {selectedAccount.bankCode}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Creación</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border text-sm">
                    {new Date(selectedAccount.createdAt).toLocaleString('es-ES')}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Última Actualización</Label>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md border text-sm">
                    {new Date(selectedAccount.updatedAt).toLocaleString('es-ES')}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsViewAccountOpen(false)}
                  className="flex-1"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setIsViewAccountOpen(false);
                    handleEditAccount(selectedAccount);
                  }}
                  className="flex-1 flowi-button"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Account Modal */}
      <Dialog open={isEditAccountOpen} onOpenChange={setIsEditAccountOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cuenta Bancaria</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de la Cuenta *</Label>
                <Input
                  value={accountForm.name}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Banco Venezuela - Pago Móvil"
                  className="flowi-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Número de Cuenta</Label>
                <Input
                  value={accountForm.accountNumber}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                  placeholder="Ej: 01020123456789"
                  className="flowi-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Cuenta</Label>
                <Select value={accountForm.accountType} onValueChange={handleAccountTypeChange}>
                  <SelectTrigger className="flowi-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={accountForm.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger className="flowi-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VES">Bolívares (VES)</SelectItem>
                    <SelectItem value="USD">Dólares (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="flowi-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Estado de la Cuenta</Label>
                <Select value={accountForm.isActive ? 'active' : 'inactive'} onValueChange={(value) => setAccountForm(prev => ({ ...prev, isActive: value === 'active' }))}>
                  <SelectTrigger className="flowi-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="inactive">Inactiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {accountForm.accountType === 'pago_movil' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código del Banco</Label>
                  <Input
                    value={accountForm.bankCode}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, bankCode: e.target.value }))}
                    placeholder="Ej: 0102"
                    className="flowi-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ej: 04141234567"
                    className="flowi-input"
                  />
                </div>
              </div>
            )}

            {accountForm.accountType === 'zelle' && (
              <div className="space-y-2">
                <Label>Email de Zelle</Label>
                <Input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Ej: zelle@business.com"
                  className="flowi-input"
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditAccountOpen(false);
                  setEditingAccount(null);
                  resetAccountForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateAccount}
                className="flex-1 flowi-button"
              >
                Actualizar Cuenta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Eliminar Cuenta
            </DialogTitle>
          </DialogHeader>
          
          {accountToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  ¿Está seguro de que desea eliminar esta cuenta bancaria?
                </p>
                <div className="font-medium text-red-800 dark:text-red-200">
                  {accountToDelete.name}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400 font-mono">
                  {accountToDelete.accountNumber}
                </div>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ Esta acción no se puede deshacer. La cuenta será eliminada permanentemente.
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setAccountToDelete(null);
                  }}
                  className="flex-1"
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {isDeleting ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">Cuentas Bancarias</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          <FuturisticCard variant="glass" className="p-6 flowi-card">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando cuentas...</p>
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No hay cuentas bancarias registradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {accounts.map((account) => {
                  const IconComponent = getAccountTypeIcon(account.accountType);
                  
                  return (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border hover:border-orange-400/50 transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                            <IconComponent className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="dark:text-gray-200 bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-medium opacity-100 text-[#1F2937]">{account.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{getAccountTypeName(account.accountType)}</p>
                          </div>
                        </div>
                        
                        <Badge className={account.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                          {account.isActive ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Cuenta:</span>
                          <span className="font-mono bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-normal opacity-100 text-[#1F2937FF]">{account.accountNumber}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Balance:</span>
                          <span className="font-bold text-orange-600">
                            {formatCurrency(account.balance, account.currency)}
                          </span>
                        </div>

                        {account.phone && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Teléfono:</span>
                            <span className="font-mono bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-normal opacity-100 text-[#1F2937FF]">{account.phone}</span>
                          </div>
                        )}

                        {account.email && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Email:</span>
                            <span className="font-mono text-xs bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-normal opacity-100 text-[#1F2937FF]">{account.email}</span>
                          </div>
                        )}

                        {account.bankCode && (
                          <div className="flex justify-between bg-[#00000000] mt-[8px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-normal opacity-100 text-[#1F2937FF]">
                            <span className="text-gray-600 dark:text-gray-400">Código:</span>
                            <span className="font-mono bg-[#00000000] mt-[0px] mr-[0px] mb-[0px] ml-[0px] pt-[0px] pr-[0px] pb-[0px] pl-[0px] font-normal opacity-100 text-[#1F2937]">{account.bankCode}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-1 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleViewAccount(account)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleEditAccount(account)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => handleDeleteAccount(account)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </FuturisticCard>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <FuturisticCard variant="glass" className="p-6 flowi-card">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    placeholder="Buscar por referencia o descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flowi-input"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={accountFilter} onValueChange={setAccountFilter}>
                  <SelectTrigger className="flowi-input">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las cuentas</SelectItem>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </FuturisticCard>

          {/* Transactions List */}
          <FuturisticCard variant="glass" className="p-6 flowi-card">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No se encontraron transacciones</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction, index) => {
                  const account = accounts.find(a => a.id === transaction.accountId);
                  
                  return (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 hover:border-orange-200 dark:hover:border-orange-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'income' 
                              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowDownLeft className="h-5 w-5" />
                            )}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-800 dark:text-gray-200">{transaction.reference}</h3>
                              <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800">
                                {getAccountTypeName(transaction.paymentMethod)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{transaction.description}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {account?.name} • {new Date(transaction.createdAt).toLocaleString('es-ES')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          
                          {transaction.phoneNumber && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <Phone className="h-3 w-3" />
                              {transaction.phoneNumber}
                            </div>
                          )}
                          
                          {transaction.zelleEmail && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <Mail className="h-3 w-3" />
                              {transaction.zelleEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </FuturisticCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
