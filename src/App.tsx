import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Home } from './views/Home';
import { Auth } from './views/Auth';
import { SupplierDashboard } from './views/Supplier/SupplierDashboard';
import { DeclareWaste } from './views/Supplier/DeclareWaste';
import { SupplierWasteList } from './views/Supplier/SupplierWasteList';
import { ProductCatalog } from './views/Client/ProductCatalog';
import { ClientOrders } from './views/Client/ClientOrders';
import { ClientFeedback } from './views/Client/ClientFeedback';
import { BatchTraceability } from './views/Client/BatchTraceability';
import { AdminDashboard } from './views/Admin/AdminDashboard';
import { ManageWaste } from './views/Admin/ManageWaste';
import { ManageBatches } from './views/Admin/ManageBatches';
import { ManageOrders } from './views/Admin/ManageOrders';
import { ManageComplaints } from './views/Admin/ManageComplaints';
import { AIDecisions } from './views/Admin/AIDecisions';
import { OperatorDashboard } from './views/Operator/OperatorDashboard';
import { TestConsole } from './views/TestConsole';
import { UserProfile } from './views/UserProfile';
import { PendingUsers } from './views/Admin/PendingUsers';
import { ManagePrices } from './views/Admin/ManagePrices';
import { ManageSubscriptions } from './views/Admin/ManageSubscriptions';
import { SubscriptionPage } from './views/Operator/SubscriptionPage';
import { About } from './views/About';
import { CollectCalendar } from './views/Admin/CollectCalendar';
import { OnboardingWizard } from './components/OnboardingWizard';
import { NetworkStatus } from './components/NetworkStatus';
import { ErrorBoundary } from './components/ErrorBoundary';

import { NakheelProvider, useNakheel } from './components/NakheelContext';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ToastProvider } from './components/Toast';
import { isSupabaseAvailable } from './services/supabaseClient';
import { AppHeader } from './components/AppHeader';
import { AppSidebar } from './components/AppSidebar';
import { DemoDrawer } from './components/DemoDrawer';
import { User, NakheelDB, evaluateWasteQualityAI } from './services/db';
import { Leaf } from 'lucide-react';
import { hideSplashScreen, setStatusBar, useAndroidBackButton } from './hooks/useCapacitor';

// --- Routing map: tab name ↔ URL path ---
const TAB_TO_PATH: Record<string, string> = {
  home: '/',
  auth: '/auth',
  traceability: '/traceability',
  'supplier-dash': '/supplier/dashboard',
  'supplier-declare': '/supplier/declare',
  'supplier-list': '/supplier/list',
  'client-dash': '/client/catalog',
  'client-catalog': '/client/catalog',
  'client-orders': '/client/orders',
  'client-feedback': '/client/feedback',
  'admin-dash': '/admin/dashboard',
  'admin-waste': '/admin/waste',
  'admin-batches': '/admin/batches',
  'admin-orders': '/admin/orders',
  'admin-complaints': '/admin/complaints',
  'admin-ai': '/admin/ai',
  'operator-dash': '/operator/dashboard',
  tests: '/tests',
  profile: '/profile',
  'admin-pending': '/admin/pending',
  'admin-prices': '/admin/prices',
  'admin-subscriptions': '/admin/subscriptions',
  'operator-subscription': '/operator/subscription',
  'about': '/about',
  'admin-calendar': '/admin/calendar',
};

const PATH_TO_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_TO_PATH)
    .filter(([tab]) => tab !== 'client-dash') // deduplicate: /client/catalog → client-catalog
    .map(([tab, path]) => [path, tab])
);

function NakheelAppInner() {
  const {
    wasteRequests, batches, orders, products, isLoading,
    addWasteRequest, evaluateWasteQuality, updateWasteRequestStatus,
    createBatch, saveQualityCheck, createOrder, confirmOrder,
    updateOrderStatus, deliverOrder
  } = useNakheel();
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Init Capacitor native features
  useEffect(() => {
    hideSplashScreen();
    setStatusBar();
  }, []);

  // Bouton retour Android : si on est sur home → quitter, sinon → home
  useAndroidBackButton(useCallback(() => {
    if (currentTab === 'home') return false; // false = quitter l'app
    setCurrentTab('home');
    return true;
  }, [currentTab]));

  // Load session from localStorage on mount
  useEffect(() => {
    const session = localStorage.getItem('nakheel_user_session');
    if (session) {
      try {
        setUser(JSON.parse(session));
        // Restore session cookie so proxy lets through protected routes
        document.cookie = 'nakheel_session=1; path=/; SameSite=Lax';
      } catch {
        localStorage.removeItem('nakheel_user_session');
      }
    }
  }, []);

  // Sync tab state from URL (handles back/forward and direct URL navigation)
  useEffect(() => {
    // Normalize trailing slash added by next.config trailingSlash: true
    const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
    if (normalizedPath === '/traceability') {
      const id = searchParams.get('id');
      setActiveBatchId(id);
      setCurrentTab('traceability');
    } else {
      setCurrentTab(PATH_TO_TAB[normalizedPath] ?? 'home');
      setActiveBatchId(null);
    }
  }, [pathname, searchParams]);
  
  // Simulation Demo States
  const [showDemoDrawer, setShowDemoDrawer] = useState(false);
  const [demoStep, setDemoStep] = useState(1);
  const [demoLog, setDemoLog] = useState<string[]>([]);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Synchronize demo log translation on language change
  useEffect(() => {
    setDemoLog([t('demo.step_init')]);
  }, [language]);
  
  // Temp references for step transitions
  const [demoRequestId, setDemoRequestId] = useState('');
  const [demoBatchId, setDemoBatchId] = useState('');
  const [demoOrderId, setDemoOrderId] = useState('');

  // Open Demo drawer event listener
  useEffect(() => {
    const handleOpenDrawer = () => setShowDemoDrawer(true);
    window.addEventListener('open-demo-drawer', handleOpenDrawer);
    return () => window.removeEventListener('open-demo-drawer', handleOpenDrawer);
  }, []);

  const navigateTo = useCallback((tabName: string, batchId: string | null = null) => {
    const path = TAB_TO_PATH[tabName] ?? '/';
    if (tabName === 'traceability' && batchId) {
      router.push(`/traceability?id=${batchId}`);
      setActiveBatchId(batchId);
    } else {
      router.push(path);
      setActiveBatchId(null);
    }
    setCurrentTab(tabName);
  }, [router]);

  // Internal navigation event (e.g. from feature-gate upgrade CTA)
  // Uses router directly to avoid any TDZ issue with navigateTo
  useEffect(() => {
    const handleNav = (e: Event) => {
      const tab = (e as CustomEvent<string>).detail;
      const path = TAB_TO_PATH[tab] ?? '/';
      router.push(path);
      setCurrentTab(tab);
      setActiveBatchId(null);
    };
    window.addEventListener('nakheel-navigate', handleNav);
    return () => window.removeEventListener('nakheel-navigate', handleNav);
  }, [router]);

  const handleLoginSuccess = useCallback((loggedInUser: User) => {
    // Block pending accounts from accessing the app
    if (loggedInUser.status === 'pending') {
      setUser(loggedInUser);
      return; // Stay on pending screen — renderTabContent handles it
    }
    setUser(loggedInUser);
    localStorage.setItem('nakheel_user_session', JSON.stringify(loggedInUser));
    // Set session cookie so the proxy lets through protected routes
    document.cookie = 'nakheel_session=1; path=/; SameSite=Lax';
    // Show onboarding for new users (not in demo seed)
    const isNewUser = !localStorage.getItem(`nakheel_onboarded_${loggedInUser.id}`);
    const isDemoUser = loggedInUser.id.startsWith('usr-');
    if (isNewUser && !isDemoUser) setShowOnboarding(true);
    if (loggedInUser.role === 'admin') navigateTo('admin-dash');
    else if (loggedInUser.role === 'operator') navigateTo('operator-dash');
    else if (loggedInUser.role === 'supplier') navigateTo('supplier-dash');
    else if (loggedInUser.role === 'client') navigateTo('client-dash');
  }, [navigateTo]);

  const handleLogout = useCallback(async () => {
    // Révoquer la session Supabase Auth si active
    if (isSupabaseAvailable) {
      const { supabase: sb } = await import('./services/supabaseClient');
      await sb?.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('nakheel_user_session');
    // Clear session cookie
    document.cookie = 'nakheel_session=; path=/; max-age=0';
    navigateTo('home');
  }, [navigateTo]);

  // ── Pending account screen ──────────────────────────────────────────────────
  if (user?.status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--neutral-light)', padding: '2rem' }}>
        <div style={{ maxWidth: '460px', background: 'white', borderRadius: 'var(--radius-lg)', padding: '2.5rem', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
            {language === 'ar' ? 'حسابك في انتظار التفعيل' : 'Votre compte est en cours de validation'}
          </h2>
          <p style={{ color: 'gray', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {language === 'ar'
              ? 'تم استلام طلبك. سيقوم فريق نخيل بمراجعته وإرسال إشعار إلى بريدك الإلكتروني خلال 24 ساعة.'
              : 'Votre demande a bien été reçue. L\'équipe GourFeed va l\'examiner et vous enverrez une confirmation par email sous 24h.'}
          </p>
          <div style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1.5rem' }}>
            📧 {user.email}
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            {language === 'ar' ? 'تسجيل الخروج' : 'Se déconnecter'}
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home onNavigate={(tab) => navigateTo(tab)} />;
      case 'auth':
        return <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'traceability':
        return <BatchTraceability initialBatchId={activeBatchId} onNavigate={(tab) => navigateTo(tab)} />;

      // Supplier Pages
      case 'supplier-dash':
        return user?.role === 'supplier' ? (
          <SupplierDashboard user={user} onSubTabChange={(tab) => navigateTo(`supplier-${tab}`)} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'supplier-declare':
        return user?.role === 'supplier' ? (
          <DeclareWaste user={user} onSuccess={() => navigateTo('supplier-list')} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'supplier-list':
        return user?.role === 'supplier' ? (
          <SupplierWasteList user={user} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;

      // Client / Breeder Pages
      case 'client-dash':
      case 'client-catalog':
        return user?.role === 'client' ? (
          <ProductCatalog user={user} onOrderSuccess={() => navigateTo('client-orders')} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'client-orders':
        return user?.role === 'client' ? (
          <ClientOrders user={user} onTraceBatch={(bid) => navigateTo('traceability', bid)} onNavigate={(tab) => navigateTo(tab)} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'client-feedback':
        return user?.role === 'client' ? (
          <ClientFeedback user={user} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;

      // Admin Pages
      case 'admin-dash':
        return user?.role === 'admin' ? (
          <AdminDashboard onSubTabChange={(tab) => navigateTo(`admin-${tab}`)} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'admin-waste':
        return user?.role === 'admin' ? (
          <ManageWaste />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'admin-batches':
        return user?.role === 'admin' ? (
          <ManageBatches />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'admin-orders':
        return user?.role === 'admin' ? (
          <ManageOrders />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'admin-complaints':
        return user?.role === 'admin' ? (
          <ManageComplaints />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'admin-ai':
        return user?.role === 'admin' ? (
          <AIDecisions />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'admin-pending':
        return user?.role === 'admin' ? (
          <PendingUsers />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'admin-prices':
        return user?.role === 'admin' ? (
          <ManagePrices />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'admin-subscriptions':
        return user?.role === 'admin' ? (
          <ManageSubscriptions />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;
      case 'operator-subscription':
        return user?.role === 'operator' ? (
          <SubscriptionPage user={user} onUserUpdate={(u) => { setUser(u); localStorage.setItem('nakheel_user_session', JSON.stringify(u)); }} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;

      // Operator Pages
      case 'operator-dash':
        return user?.role === 'operator' ? (
          <OperatorDashboard user={user} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;

      case 'about':
        return <About onNavigate={(tab) => navigateTo(tab)} />;

      case 'admin-calendar':
        return user?.role === 'admin' ? (
          <CollectCalendar />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;

      case 'tests':
        return user?.role === 'admin' ? (
          <TestConsole />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;

      case 'profile':
        return user ? (
          <UserProfile user={user} onUserUpdate={(updated) => {
            setUser(updated);
            localStorage.setItem('nakheel_user_session', JSON.stringify(updated));
          }} />
        ) : <Auth onLoginSuccess={handleLoginSuccess} />;

      default:
        return <Home onNavigate={(tab) => navigateTo(tab)} />;
    }
  };

  const getRoleBadgeLabel = (role?: string) => {
    if (role === 'admin') return 'Administrateur';
    if (role === 'operator') return 'Opérateur';
    if (role === 'supplier') return 'Producteur Oasien';
    if (role === 'client') return 'Éleveur';
    return '';
  };

  // --- DEMO WALKTHROUGH LOGIC ---
  const runDemoStep = useCallback(async (step: number) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const getAIDecisionLabel = (decision?: string) => {
      if (decision === 'accepté') return language === 'ar' ? 'مقبول' : 'accepté';
      if (decision === 'à sécher') return language === 'ar' ? 'بحاجة لتجفيف' : 'à sécher';
      if (decision === 'à trier') return language === 'ar' ? 'بحاجة لفرز' : 'à trier';
      if (decision === 'rejeté') return language === 'ar' ? 'مرفوض' : 'rejeté';
      return decision || '';
    };

    if (step === 1) {
      // Step 1: Supplier declares waste (800 kg of palm leaves)
      const reqId = await addWasteRequest(
        'palm_leaves',
        800,
        'Tolga, Wilaya de Biskra',
        todayStr,
        'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=300&q=80',
        'usr-supp-1'
      );
      setDemoRequestId(reqId);
      setDemoLog([
        t('demo.step_1_log', { id: reqId })
      ]);
      setDemoStep(2);

      // Auto login supplier in background to show Supplier view
      const supplierUser = NakheelDB.getUsers().find(u => u.id === 'usr-supp-1');
      if (supplierUser) {
        setUser(supplierUser);
        navigateTo('supplier-list');
      }
    } else if (step === 2) {
      // Step 2: Quality score inspection (Calculates score 78/100)
      await evaluateWasteQuality(demoRequestId, 'medium', 'low', 'sec');
      const req = NakheelDB.getWasteRequests().find(r => r.id === demoRequestId);
      setDemoLog(prev => [
        ...prev,
        t('demo.step_2_log', { score: req?.aiQualityScore || 78, decision: getAIDecisionLabel(req?.aiDecision || 'à sécher') })
      ]);
      setDemoStep(3);

      // Navigate to Admin to see Quality evaluation
      const adminUser = NakheelDB.getUsers().find(u => u.role === 'admin');
      if (adminUser) {
        setUser(adminUser);
        navigateTo('admin-waste');
      }
    } else if (step === 3) {
      // Step 3: Admin accepts waste
      await updateWasteRequestStatus(demoRequestId, 'accepted');
      setDemoLog(prev => [
        ...prev,
        t('demo.step_3_log')
      ]);
      setDemoStep(4);
      navigateTo('admin-waste');
    } else if (step === 4) {
      // Step 4: Admin schedules collection
      const pickupDate = new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0];
      await updateWasteRequestStatus(demoRequestId, 'scheduled_for_pickup', pickupDate);
      setDemoLog(prev => [
        ...prev,
        t('demo.step_4_log', { date: pickupDate })
      ]);
      setDemoStep(5);
      navigateTo('admin-waste');
    } else if (step === 5) {
      // Step 5: Collected by Driver
      await updateWasteRequestStatus(demoRequestId, 'collected');
      setDemoLog(prev => [
        ...prev,
        t('demo.step_5_log')
      ]);
      setDemoStep(6);
      navigateTo('admin-waste');
    } else if (step === 6) {
      // Step 6: Received at Processing Center
      await updateWasteRequestStatus(demoRequestId, 'received');
      setDemoLog(prev => [
        ...prev,
        t('demo.step_6_log')
      ]);
      setDemoStep(7);
      navigateTo('admin-waste');
    } else if (step === 7) {
      // Step 7: Stored in Silo (creates RawMaterialBatch)
      await updateWasteRequestStatus(demoRequestId, 'stored');
      const rmb = NakheelDB.getRawMaterialBatches().find(r => r.wasteRequestIds.includes(demoRequestId));
      const rmbId = rmb ? rmb.id : 'RMB-001';
      
      setDemoLog(prev => [
        ...prev,
        t('demo.step_7_log', { id: rmbId })
      ]);
      setDemoStep(8);
      
      // Auto login operator
      const operatorUser = NakheelDB.getUsers().find(u => u.role === 'operator');
      if (operatorUser) {
        setUser(operatorUser);
        navigateTo('operator-dash');
      }
    } else if (step === 8) {
      // Step 8: Operator creates production batch from raw material batch
      const rmb = NakheelDB.getRawMaterialBatches().find(r => r.wasteRequestIds.includes(demoRequestId));
      const rmbId = rmb ? rmb.id : 'RMB-001';
      
      await createBatch([rmbId], 750, 'PROD-001', 'F-Mouton-Éco-V1');
      
      const newB = NakheelDB.getProductionBatches()[0]; // unshifted
      setDemoBatchId(newB.id);
      
      setDemoLog(prev => [
        ...prev,
        t('demo.step_8_log', { batch: newB.batchNumber })
      ]);
      setDemoStep(9);
      navigateTo('operator-dash');
    } else if (step === 9) {
      // Step 9: Laboratory QA chemical check & validation + QR Code generated
      await saveQualityCheck(demoBatchId, 11.0, 14.8, 13.0, true, 'Lot conforme aux normes nutritionnelles, humidité 11%, fibres 14.8%.', 'approved');
      
      const updatedBatch = NakheelDB.getProductionBatches().find(b => b.id === demoBatchId);
      
      setDemoLog(prev => [
        ...prev,
        t('demo.step_9_log', { batch: updatedBatch?.batchNumber || 'NAK-26-005' })
      ]);
      setDemoStep(10);
      navigateTo('operator-dash');
    } else if (step === 10) {
      // Step 10: Breeder client orders 200 kg and stock reservation
      await createOrder('usr-client-1', [{ productId: 'PROD-001', quantityKg: 200 }], 'delivery', 'Sidi Aïssa, Wilaya de M\'Sila');

      const newOrder = NakheelDB.getOrders()[0]; // newly created
      const orderId = newOrder.id;
      setDemoOrderId(orderId);

      // Confirm order (reserves stock)
      await confirmOrder(orderId);
      await updateOrderStatus(orderId, 'preparing', demoBatchId);
 
      const updatedBatch = NakheelDB.getProductionBatches().find(b => b.id === demoBatchId);
      setDemoLog(prev => [
        ...prev,
        t('demo.step_10_log', { batch: updatedBatch?.batchNumber || '' })
      ]);
      setDemoStep(11);
 
      const clientUser = NakheelDB.getUsers().find(u => u.id === 'usr-client-1');
      if (clientUser) {
        setUser(clientUser);
        navigateTo('client-orders');
      }
    } else if (step === 11) {
      // Step 11: Delivery confirmed and traceability shown
      await deliverOrder(demoOrderId);
      setDemoLog(prev => [
        ...prev,
        t('demo.step_11_log')
      ]);
      setDemoStep(12);
      navigateTo('traceability', demoBatchId);
    } else if (step === 12) {
      // Step 12: Dashboard updated automatically
      setDemoLog(prev => [
        ...prev,
        t('demo.step_12_log')
      ]);
      setDemoStep(1);
      setIsAutoPlaying(false);
 
      // Auto navigate to Admin AI Dashboard
      const adminUser = NakheelDB.getUsers().find(u => u.role === 'admin');
      if (adminUser) {
        setUser(adminUser);
        navigateTo('admin-ai');
      }
    }
  }, [
    language, t, navigateTo,
    demoRequestId, demoBatchId, demoOrderId,
    addWasteRequest, evaluateWasteQuality, updateWasteRequestStatus,
    createBatch, saveQualityCheck, createOrder, confirmOrder, updateOrderStatus, deliverOrder,
  ]);

  // Autoplay handler — placed after runDemoStep declaration to avoid temporal dead zone
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setTimeout(() => runDemoStep(demoStep), 2800);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, demoStep, runDemoStep]);

  const handleResetDemo = () => {
    NakheelDB.initialize(true); // force reload seed data
    setUser(null);
    setDemoRequestId('');
    setDemoBatchId('');
    setDemoOrderId('');
    setDemoStep(1);
    setIsAutoPlaying(false);
    setDemoLog([t('demo.step_init')]);
    navigateTo('home');
  };

  const demoSteps = [
    { s: 1, title: t('demo.step_1_title'), desc: t('demo.step_1_desc') },
    { s: 2, title: t('demo.step_2_title'), desc: t('demo.step_2_desc') },
    { s: 3, title: t('demo.step_3_title'), desc: t('demo.step_3_desc') },
    { s: 4, title: t('demo.step_4_title'), desc: t('demo.step_4_desc') },
    { s: 5, title: t('demo.step_5_title'), desc: t('demo.step_5_desc') },
    { s: 6, title: t('demo.step_6_title'), desc: t('demo.step_6_desc') },
    { s: 7, title: t('demo.step_7_title'), desc: t('demo.step_7_desc') },
    { s: 8, title: t('demo.step_8_title'), desc: t('demo.step_8_desc') },
    { s: 9, title: t('demo.step_9_title'), desc: t('demo.step_9_desc') },
    { s: 10, title: t('demo.step_10_title'), desc: t('demo.step_10_desc') },
    { s: 11, title: t('demo.step_11_title'), desc: t('demo.step_11_desc') },
    { s: 12, title: t('demo.step_12_title'), desc: t('demo.step_12_desc') },
  ];

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#ffffff',
        gap: '1.2rem', zIndex: 9999,
      }}>
        <img
          src="/logo.jpeg"
          alt="GourFeed"
          style={{
            width: '200px',
            height: '200px',
            objectFit: 'contain',
            animation: 'fadeIn 0.6s ease-in',
          }}
        />
        <div style={{
          color: '#2E5A44',
          fontSize: '1.5rem',
          fontWeight: 800,
          letterSpacing: '1px',
          fontFamily: 'var(--font-display)',
          animation: 'fadeIn 0.8s ease-in',
        }}>GourFeed</div>
        <div style={{
          width: '160px', height: '3px', background: 'rgba(46,90,68,0.15)',
          borderRadius: '2px', overflow: 'hidden',
          marginTop: '0.5rem',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #2E5A44, #a8735a)',
            borderRadius: '2px',
            animation: 'loading-bar 1.4s ease-in-out infinite',
            width: '40%',
          }} />
        </div>
        <style>{`
          @keyframes loading-bar {
            0%   { transform: translateX(-100%) scaleX(1); }
            50%  { transform: translateX(112.5%) scaleX(1.5); }
            100% { transform: translateX(350%) scaleX(1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <NetworkStatus />
      {showOnboarding && user && (
        <OnboardingWizard user={user} onComplete={() => setShowOnboarding(false)} />
      )}
      <AppHeader
        user={user}
        currentTab={currentTab}
        language={language}
        onNavigate={navigateTo}
        onShowDemo={() => setShowDemoDrawer(true)}
        onLogout={handleLogout}
        onSetLanguage={setLanguage}
        getRoleBadgeLabel={getRoleBadgeLabel}
        t={t}
      />

      <main className="main-content container" style={{ padding: '2rem 1.5rem' }}>
        {user && currentTab !== 'about' ? (
          <div className="dashboard-grid">
            <AppSidebar
              user={user}
              currentTab={currentTab}
              onNavigate={navigateTo}
              getRoleBadgeLabel={getRoleBadgeLabel}
              t={t}
              language={language}
            />
            <div style={{ minHeight: '60vh' }}>
              {renderTabContent()}
            </div>
          </div>
        ) : (
          renderTabContent()
        )}
      </main>

      <footer className="footer animate-fade-in">
        <div className="container footer-inner">
          <div className="footer-logo">
            <Leaf size={16} style={{ color: 'var(--accent)', transform: 'rotate(-10deg)' }} />
            <span>GourFeed</span>
          </div>
          <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.8rem', color: '#8c887e', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>{t('nav.footer_slogan')}</span>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigateTo('about')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: 600, padding: 0 }}>
              {language === 'ar' ? 'عن نخيل' : 'À propos'}
            </button>
            <span style={{ color: '#8c887e' }}>•</span>
            <button onClick={() => navigateTo('traceability')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8c887e', padding: 0 }}>
              {language === 'ar' ? 'تتبع دفعة' : 'Traçabilité'}
            </button>
            <span style={{ color: '#8c887e' }}>•</span>
            <a href="mailto:contact@nakheel.dz" style={{ color: '#8c887e', textDecoration: 'none' }}>contact@nakheel.dz</a>
          </div>
          <div className="footer-copy">
            © {new Date().getFullYear()} {t('nav.footer_copy')}
          </div>
        </div>
      </footer>

      <DemoDrawer
        show={showDemoDrawer}
        demoStep={demoStep}
        demoLog={demoLog}
        isAutoPlaying={isAutoPlaying}
        steps={demoSteps}
        onClose={() => setShowDemoDrawer(false)}
        onRunStep={() => runDemoStep(demoStep)}
        onToggleAutoplay={() => setIsAutoPlaying(!isAutoPlaying)}
        onReset={handleResetDemo}
        t={t}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <NakheelProvider>
          <LanguageProvider>
            <NakheelAppInner />
          </LanguageProvider>
        </NakheelProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
