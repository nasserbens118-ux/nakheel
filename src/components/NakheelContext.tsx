import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const genId = () => crypto.randomUUID().split('-')[0].toUpperCase();

import {
  NakheelDB, User, Supplier, Client, WasteRequest, RawMaterialBatch,
  Product, ProductionBatch, QualityCheck, Inventory, Order, OrderItem, Complaint, AIPrediction,
  DashboardMetrics,
  WasteStatus, OrderStatus, ProductionBatchStatus, QualityDecision, ComplaintType,
  calculateWasteQualityScore, calculateDemandForecast, reserveStockLocal, releaseStockLocal, confirmDelivery,
  generateBatchNumber, generateTraceabilityQRCode, HumidityLevel, ImpurityLevel,
  evaluateWasteQualityAI, predictDemandAI, evaluateStockAlertsAI, getProductionRecommendationsAI
} from '../services/db';
import { isSupabaseAvailable, supabase as supabaseClient } from '../services/supabaseClient';
import {
  initNotifications,
  notifyCollectionScheduled,
  notifyOrderStatusChanged,
  notifyQualityResult,
  notifyComplaintReceived,
} from '../services/notifications';
import {
  emailOrderConfirmed,
  emailCollectionScheduled,
  emailPaymentConfirmed,
  emailQualityResult,
} from '../services/emailNotifications';

// Lazily import the Supabase layer only when configured, to avoid crashing in demo mode.
let sDB: typeof import('../services/supabaseDB') | null = null;
if (isSupabaseAvailable) {
  import('../services/supabaseDB').then(mod => { sDB = mod; });
}

interface NakheelContextType {
  users: User[];
  suppliers: Supplier[];
  clients: Client[];
  wasteRequests: WasteRequest[];
  rawMaterialBatches: RawMaterialBatch[];
  products: Product[];
  batches: ProductionBatch[];
  qualityChecks: QualityCheck[];
  inventory: Inventory[];
  orders: Order[];
  orderItems: OrderItem[];
  complaints: Complaint[];
  aiPredictions: AIPrediction[];
  metrics: DashboardMetrics;
  isLoading: boolean;

  addWasteRequest: (wasteType: any, qty: number, location: string, date: string, photoUrl?: string, supplierId?: string) => Promise<string>;
  updateWasteRequestStatus: (id: string, status: WasteStatus, date?: string, driverName?: string, vehicleRef?: string) => Promise<void>;
  evaluateWasteQuality: (id: string, humidity: HumidityLevel, impurity: ImpurityLevel, visualState?: 'sec' | 'humide' | 'mélangé' | 'douteux') => Promise<void>;
  createOrder: (clientId: string, items: { productId: string; quantityKg: number }[], deliveryMethod: 'pickup' | 'delivery', deliveryLocation: string, commissionAmount?: number) => Promise<void>;
  confirmOrder: (id: string) => Promise<boolean>;
  cancelOrder: (id: string) => Promise<void>;
  deliverOrder: (id: string) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus, batchId?: string) => Promise<void>;
  createBatch: (selectedRawMaterialBatchIds: string[], qty: number, productId: string, formulaUsed: string) => Promise<void>;
  updateBatchStatus: (id: string, status: ProductionBatchStatus) => Promise<void>;
  saveQualityCheck: (productionBatchId: string, humidity: number, fiber: number, proteinTarget: number, impurityCheck: boolean, safetyNotes: string, decision: QualityDecision) => Promise<void>;
  submitComplaint: (clientId: string, orderId: string, productionBatchId: string, complaintType: ComplaintType, message: string) => Promise<void>;
  replyToComplaint: (id: string, reply: string) => Promise<void>;
}

const EMPTY_METRICS: DashboardMetrics = {
  totalFeedProduced: 0, totalWasteAvailable: 0, compliantCount: 0,
  totalSuppliers: 0, totalClients: 0, totalWasteDeclared: 0,
  totalWasteAccepted: 0, totalWasteRejected: 0, totalWasteCollected: 0,
  batchesCount: 0, batchesApprovedCount: 0, stockAvailable: 0,
  stockReserved: 0, stockSold: 0, pendingOrders: 0,
  deliveredOrders: 0, totalOrdersCount: 0, salesTotal: 0,
  co2Saved: 0, supportOasisDA: 0, complaintRatePercent: 0,
  averageQualityScore: 0, wasteStockRaw: { palmes: 0, noyaux: 0, dattes: 0, fibres: 0, melange: 0 },
  complaintsCount: 0, pendingComplaintsCount: 0,
};

const NakheelContext = createContext<NakheelContextType | undefined>(undefined);

export const NakheelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers]                   = useState<User[]>([]);
  const [suppliers, setSuppliers]           = useState<Supplier[]>([]);
  const [clients, setClients]               = useState<Client[]>([]);
  const [wasteRequests, setWasteRequests]   = useState<WasteRequest[]>([]);
  const [rawMaterialBatches, setRawMaterialBatches] = useState<RawMaterialBatch[]>([]);
  const [products, setProducts]             = useState<Product[]>([]);
  const [batches, setBatches]               = useState<ProductionBatch[]>([]);
  const [qualityChecks, setQualityChecks]   = useState<QualityCheck[]>([]);
  const [inventory, setInventory]           = useState<Inventory[]>([]);
  const [orders, setOrders]                 = useState<Order[]>([]);
  const [orderItems, setOrderItems]         = useState<OrderItem[]>([]);
  const [complaints, setComplaints]         = useState<Complaint[]>([]);
  const [aiPredictions, setAiPredictions]   = useState<AIPrediction[]>([]);
  const [metrics, setMetrics]               = useState<DashboardMetrics>(EMPTY_METRICS);
  const [isLoading, setIsLoading]           = useState(true);

  const reloadAllData = useCallback(async () => {
    if (isSupabaseAvailable && sDB) {
      // ── Supabase mode ──────────────────────────────────────
      try {
        const [u, sup, cli, wr, rmb, prod, bat, qc, inv, ord, oi, comp, ai, met] = await Promise.all([
          sDB.getUsers(),
          sDB.getSuppliers(),
          sDB.getClients(),
          sDB.getWasteRequests(),
          sDB.getRawMaterialBatches(),
          sDB.getProducts(),
          sDB.getProductionBatches(),
          sDB.getQualityChecks(),
          sDB.getInventory(),
          sDB.getOrders(),
          sDB.getOrderItems(),
          sDB.getComplaints(),
          sDB.getAIPredictions(),
          sDB.getDashboardMetrics(),
        ]);
        setUsers(u); setSuppliers(sup); setClients(cli);
        setWasteRequests(wr); setRawMaterialBatches(rmb); setProducts(prod);
        setBatches(bat); setQualityChecks(qc); setInventory(inv);
        setOrders(ord); setOrderItems(oi); setComplaints(comp);
        setAiPredictions(ai); setMetrics(met);
      } catch (err) {
        console.error('[Nakheel] Supabase load failed, falling back to localStorage', err);
        loadFromLocalStorage();
      }
    } else {
      // ── localStorage (demo) mode ───────────────────────────
      loadFromLocalStorage();
    }
    setIsLoading(false);
  }, []);

  function loadFromLocalStorage() {
    NakheelDB.initialize();
    setUsers(NakheelDB.getUsers());
    setSuppliers(NakheelDB.getSuppliers());
    setClients(NakheelDB.getClients());
    setWasteRequests(NakheelDB.getWasteRequests());
    setRawMaterialBatches(NakheelDB.getRawMaterialBatches());
    setProducts(NakheelDB.getProducts());
    setBatches(NakheelDB.getProductionBatches());
    setQualityChecks(NakheelDB.getQualityChecks());
    setInventory(NakheelDB.getInventory());
    setOrders(NakheelDB.getOrders());
    setOrderItems(NakheelDB.getOrderItems());
    setComplaints(NakheelDB.getComplaints());
    setAiPredictions(NakheelDB.getAIPredictions());
    setMetrics(NakheelDB.getDashboardMetrics());
  }

  useEffect(() => {
    initNotifications().catch(() => null);

    if (isSupabaseAvailable) {
      import('../services/supabaseDB').then(mod => {
        sDB = mod;
        mod.ensureStorageBucket().catch(() => null);
        reloadAllData();
      });

      // Supabase Realtime — re-sync whenever any watched table changes
      if (supabaseClient) {
        const channel = supabaseClient
          .channel('nakheel-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'waste_requests' },    () => reloadAllData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },             () => reloadAllData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'production_batches' }, () => reloadAllData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' },          () => reloadAllData())
          .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' },         () => reloadAllData())
          .subscribe();
        return () => { supabaseClient!.removeChannel(channel); };
      }
    } else {
      reloadAllData();
      const handleUpdate = () => reloadAllData();
      window.addEventListener('nakheel-db-update', handleUpdate);
      return () => window.removeEventListener('nakheel-db-update', handleUpdate);
    }
  }, [reloadAllData]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const addWasteRequest = async (
    wasteType: any, qty: number, location: string, date: string, photoUrl?: string, supplierId?: string
  ): Promise<string> => {
    const id = `WR-${genId()}`;
    const newRequest: WasteRequest = {
      id,
      supplierId: supplierId || 'usr-supp-1',
      wasteType,
      estimatedQuantityKg: Math.round(qty),
      humidityLevel: 'medium',
      impurityLevel: 'medium',
      photoUrl,
      location,
      availabilityDate: date,
      aiQualityScore: 0,
      adminDecision: 'pending',
      status: 'submitted',
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (isSupabaseAvailable && sDB) {
      await sDB.upsertWasteRequest(newRequest);
    } else {
      const list = NakheelDB.getWasteRequests();
      list.unshift(newRequest);
      NakheelDB.saveWasteRequests(list);
      const suppliersList = NakheelDB.getSuppliers();
      const sIdx = suppliersList.findIndex(s => s.userId === (supplierId || 'usr-supp-1'));
      if (sIdx >= 0) { suppliersList[sIdx].totalWasteDeclared += Math.round(qty); NakheelDB.saveSuppliers(suppliersList); }
    }
    await reloadAllData();
    return id;
  };

  const updateWasteRequestStatus = async (id: string, status: WasteStatus, date?: string, driverName?: string, vehicleRef?: string): Promise<void> => {
    if (isSupabaseAvailable && sDB) {
      const existing = wasteRequests.find(w => w.id === id);
      if (existing) {
        const updated: WasteRequest = {
          ...existing,
          status,
          adminDecision: status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : existing.adminDecision,
          ...(date ? { scheduledDate: date } as any : {}),
        };
        await sDB.upsertWasteRequest(updated);
        if (status === 'stored') {
          const rmb: RawMaterialBatch = {
            id: `RMB-${genId()}`,
            wasteRequestIds: [id],
            totalQuantityKg: existing.estimatedQuantityKg,
            acceptedQuantityKg: existing.estimatedQuantityKg,
            rejectedQuantityKg: 0,
            storageLocation: 'Silo Temp-' + existing.location.split(',')[0].trim(),
            receivedAt: new Date().toISOString().split('T')[0],
            status: 'stored',
          };
          await sDB.upsertRawMaterialBatch(rmb);
        }
      }
    } else {
      const list = NakheelDB.getWasteRequests();
      const index = list.findIndex(r => r.id === id);
      if (index >= 0) {
        list[index].status = status;
        if (status === 'accepted') {
          list[index].adminDecision = 'accepted';
          const suppliersList = NakheelDB.getSuppliers();
          const sIdx = suppliersList.findIndex(s => s.userId === list[index].supplierId);
          if (sIdx >= 0) { suppliersList[sIdx].totalWasteAccepted += list[index].estimatedQuantityKg; NakheelDB.saveSuppliers(suppliersList); }
        } else if (status === 'rejected') {
          list[index].adminDecision = 'rejected';
        }
        if (status === 'stored') {
          const rawBatches = NakheelDB.getRawMaterialBatches();
          rawBatches.unshift({
            id: `RMB-${genId()}`, wasteRequestIds: [id],
            totalQuantityKg: list[index].estimatedQuantityKg,
            acceptedQuantityKg: list[index].estimatedQuantityKg, rejectedQuantityKg: 0,
            storageLocation: 'Silo Temp-' + list[index].location.split(',')[0].trim(),
            receivedAt: new Date().toISOString().split('T')[0], status: 'stored',
          });
          NakheelDB.saveRawMaterialBatches(rawBatches);
        }
        if (date) (list[index] as any).scheduledDate = date;
        if (driverName) list[index].driverName = driverName;
        if (vehicleRef) list[index].vehicleRef = vehicleRef;
        NakheelDB.saveWasteRequests(list);
      }
    }
    // Cache before reloadAllData to avoid stale closure
    const reqForNotif = wasteRequests.find(w => w.id === id);
    const supplierUserForNotif = reqForNotif ? users.find(u => u.id === reqForNotif.supplierId) : null;

    await reloadAllData();

    // Browser notification + email
    if (status === 'scheduled_for_pickup' && date) {
      const req = reqForNotif;
      const supplierUser = supplierUserForNotif;
      notifyCollectionScheduled(supplierUser?.fullName ?? 'Producteur', date).catch(() => null);
      if (supplierUser?.email) {
        emailCollectionScheduled(
          supplierUser.email,
          supplierUser.fullName,
          date,
          req?.location ?? ''
        ).catch(() => null);
      }
    }
  };

  const evaluateWasteQuality = async (
    id: string, humidity: HumidityLevel, impurity: ImpurityLevel, visualState: 'sec' | 'humide' | 'mélangé' | 'douteux' = 'sec'
  ): Promise<void> => {
    const existing = wasteRequests.find(w => w.id === id);
    if (!existing) return;

    const result = evaluateWasteQualityAI(existing.wasteType, humidity, impurity, visualState, existing.estimatedQuantityKg);
    const updated: WasteRequest = {
      ...existing,
      aiQualityScore: result.score, humidityLevel: humidity, impurityLevel: impurity,
      visualState, aiDecision: result.decision, aiRecommendation: result.recommendation, status: 'ai_scored',
    };
    const newPred: AIPrediction = {
      id: `AP-${genId()}`, predictionType: 'waste_quality',
      inputData: JSON.stringify({ wasteType: existing.wasteType, humidityLevel: humidity, impurityLevel: impurity, visualState, quantityKg: existing.estimatedQuantityKg }),
      outputResult: JSON.stringify(result), confidenceScore: parseFloat((result.score / 100).toFixed(2)),
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (isSupabaseAvailable && sDB) {
      await sDB.upsertWasteRequest(updated);
      await sDB.upsertAIPrediction(newPred);
    } else {
      const list = NakheelDB.getWasteRequests();
      const index = list.findIndex(w => w.id === id);
      if (index >= 0) { Object.assign(list[index], updated); NakheelDB.saveWasteRequests(list); }
      const preds = NakheelDB.getAIPredictions(); preds.unshift(newPred); NakheelDB.saveAIPredictions(preds);
    }
    await reloadAllData();
  };

  const createOrder = async (
    clientId: string, items: { productId: string; quantityKg: number }[], deliveryMethod: 'pickup' | 'delivery', deliveryLocation: string, commissionAmount?: number
  ): Promise<void> => {
    const orderId = `ORD-${genId()}`;
    const itemsToSave: OrderItem[] = items.map((item, idx) => {
      const p = products.find(prod => prod.id === item.productId);
      const price = p ? p.pricePerKg : 50;
      return { id: `OI-${orderId}-${idx}`, orderId, productId: item.productId, productionBatchId: '', quantityKg: item.quantityKg, unitPrice: price, totalPrice: price * item.quantityKg };
    });
    const totalAmount = itemsToSave.reduce((s, i) => s + i.totalPrice, 0);
    const newOrder: Order = {
      id: orderId, clientId, orderItems: itemsToSave,
      totalQuantityKg: itemsToSave.reduce((s, i) => s + i.quantityKg, 0),
      totalAmount,
      commissionAmount: commissionAmount ?? Math.round(totalAmount * 0.04),
      deliveryMethod, deliveryLocation, status: 'created', paymentStatus: 'unpaid',
      createdAt: new Date().toISOString().split('T')[0],
    };

    if (isSupabaseAvailable && sDB) {
      await sDB.upsertOrder(newOrder);
    } else {
      const ordersList = NakheelDB.getOrders(); ordersList.unshift(newOrder); NakheelDB.saveOrders(ordersList);
      NakheelDB.saveOrderItems([...itemsToSave, ...NakheelDB.getOrderItems()]);
    }
    await reloadAllData();
  };

  const confirmOrder = async (id: string): Promise<boolean> => {
    const order = orders.find(o => o.id === id);
    if (!order) return false;

    if (isSupabaseAvailable && sDB) {
      const { supabase: sb } = await import('../services/supabaseClient');
      const { data } = await sb!.rpc('reserve_stock', { order_id: id });
      await reloadAllData();
      return Boolean(data);
    } else {
      const oList = NakheelDB.getOrders();
      const oIndex = oList.findIndex(o => o.id === id);
      if (oIndex < 0) return false;
      const inventoryList = NakheelDB.getInventory();
      let canConfirm = true;
      oList[oIndex].orderItems.forEach(item => {
        const totalAvail = inventoryList.filter(inv => inv.productId === item.productId).reduce((s, i) => s + i.availableQuantityKg, 0);
        if (totalAvail < item.quantityKg) canConfirm = false;
      });
      if (!canConfirm) return false;
      oList[oIndex].orderItems.forEach(item => {
        const reserved = reserveStockLocal(inventoryList, item.productId, item.quantityKg);
        if (reserved) item.productionBatchId = reserved.productionBatchId;
      });
      oList[oIndex].status = 'confirmed';
      NakheelDB.saveInventory(inventoryList); NakheelDB.saveOrders(oList);
      await reloadAllData();
      return true;
    }
  };

  const cancelOrder = async (id: string): Promise<void> => {
    if (isSupabaseAvailable && sDB) {
      const { supabase: sb } = await import('../services/supabaseClient');
      await sb!.rpc('cancel_order', { order_id: id });
    } else {
      const oList = NakheelDB.getOrders();
      const oIndex = oList.findIndex(o => o.id === id);
      if (oIndex >= 0) {
        const inventoryList = NakheelDB.getInventory();
        if (['confirmed','stock_reserved','preparing','out_for_delivery'].includes(oList[oIndex].status)) {
          oList[oIndex].orderItems.forEach(item => releaseStockLocal(inventoryList, item.productId, item.quantityKg, item.productionBatchId));
        }
        oList[oIndex].status = 'cancelled';
        NakheelDB.saveInventory(inventoryList); NakheelDB.saveOrders(oList);
      }
    }
    await reloadAllData();
  };

  const deliverOrder = async (id: string): Promise<void> => {
    if (isSupabaseAvailable && sDB) {
      const { supabase: sb } = await import('../services/supabaseClient');
      await sb!.rpc('confirm_delivery', { order_id: id });
    } else {
      const oList = NakheelDB.getOrders();
      const inventoryList = NakheelDB.getInventory();
      confirmDelivery(oList, inventoryList, id);
      NakheelDB.saveInventory(inventoryList); NakheelDB.saveOrders(oList);
    }
    // Cache before reloadAllData to avoid stale closure
    const oForNotif = orders.find(x => x.id === id);
    const clientUserForNotif = users.find(u => u.id === oForNotif?.clientId);
    await reloadAllData();
    notifyOrderStatusChanged(oForNotif?.id ?? id, 'delivered').catch(() => null);
    const o = oForNotif;
    const clientUser = clientUserForNotif;
    if (clientUser?.email && o) {
      emailOrderConfirmed(clientUser.email, clientUser.fullName, id, o.totalAmount).catch(() => null);
    }
  };

  const updateOrderStatus = async (id: string, status: OrderStatus, batchId?: string): Promise<void> => {
    if (isSupabaseAvailable && sDB) {
      const order = orders.find(o => o.id === id);
      if (order) await sDB.upsertOrder({ ...order, status });
    } else {
      const oList = NakheelDB.getOrders();
      const oIndex = oList.findIndex(o => o.id === id);
      if (oIndex >= 0) {
        oList[oIndex].status = status;
        if (batchId) oList[oIndex].orderItems.forEach(oi => { oi.productionBatchId = batchId; });
        NakheelDB.saveOrders(oList);
      }
    }
    await reloadAllData();
    notifyOrderStatusChanged(id, status).catch(() => null);
  };

  const createBatch = async (selectedRawMaterialBatchIds: string[], qty: number, productId: string, formulaUsed: string): Promise<void> => {
    const nextNumber = generateBatchNumber(batches.length);
    const qrCode = generateTraceabilityQRCode(nextNumber);
    const newBatch: ProductionBatch = {
      id: `BAT-${genId()}`, batchNumber: nextNumber, productId,
      rawMaterialBatchIds: selectedRawMaterialBatchIds, producedQuantityKg: qty,
      productionDate: new Date().toISOString().split('T')[0], formulaUsed,
      qualityStatus: 'à vérifier', qrCodeUrl: qrCode, status: 'draft',
      notes: 'Lancement formulation oasienne.',
    };

    if (isSupabaseAvailable && sDB) {
      await sDB.upsertProductionBatch(newBatch);
      for (const rmbId of selectedRawMaterialBatchIds) {
        const rmb = rawMaterialBatches.find(r => r.id === rmbId);
        if (rmb) await sDB.upsertRawMaterialBatch({ ...rmb, status: 'consumed' });
      }
    } else {
      const pBatches = NakheelDB.getProductionBatches(); pBatches.unshift(newBatch); NakheelDB.saveProductionBatches(pBatches);
      const rmbList = NakheelDB.getRawMaterialBatches();
      selectedRawMaterialBatchIds.forEach(rmbId => { const idx = rmbList.findIndex(r => r.id === rmbId); if (idx >= 0) rmbList[idx].status = 'consumed'; });
      NakheelDB.saveRawMaterialBatches(rmbList);
    }
    await reloadAllData();
  };

  const updateBatchStatus = async (id: string, status: ProductionBatchStatus): Promise<void> => {
    if (isSupabaseAvailable && sDB) {
      const b = batches.find(b => b.id === id);
      if (b) await sDB.upsertProductionBatch({ ...b, status });
    } else {
      const list = NakheelDB.getProductionBatches();
      const index = list.findIndex(b => b.id === id);
      if (index >= 0) { list[index].status = status; NakheelDB.saveProductionBatches(list); }
    }
    await reloadAllData();
  };

  const saveQualityCheck = async (
    productionBatchId: string, humidity: number, fiber: number, proteinTarget: number,
    impurityCheck: boolean, safetyNotes: string, decision: QualityDecision
  ): Promise<void> => {
    const newQC: QualityCheck = {
      id: `QC-${genId()}`, productionBatchId, humidity, fiber, proteinTarget,
      impurityCheck, safetyNotes, decision, checkedBy: 'Dr. Karim Merabet',
      checkedAt: new Date().toISOString().split('T')[0],
    };

    if (isSupabaseAvailable && sDB) {
      await sDB.upsertQualityCheck(newQC);
      const b = batches.find(b => b.id === productionBatchId);
      if (b) {
        const newStatus: ProductionBatch['status'] = decision === 'approved' ? 'in_stock' : decision === 'rejected' ? 'rejected' : 'quality_pending';
        await sDB.upsertProductionBatch({ ...b, qualityStatus: decision === 'approved' ? 'conforme' : 'rejeté', status: newStatus, notes: safetyNotes });
        if (decision === 'approved') {
          const invId = `INV-${genId()}`;
          await sDB.upsertInventory({
            id: invId, productId: b.productId, productionBatchId,
            availableQuantityKg: b.producedQuantityKg,
            reservedQuantityKg: 0, soldQuantityKg: 0, damagedQuantityKg: 0,
            lastUpdated: new Date().toISOString().split('T')[0],
          });
        }
      }
    } else {
      const checks = NakheelDB.getQualityChecks();
      const existingIndex = checks.findIndex(c => c.productionBatchId === productionBatchId);
      if (existingIndex >= 0) checks[existingIndex] = newQC; else checks.unshift(newQC);
      NakheelDB.saveQualityChecks(checks);
      const pBatches = NakheelDB.getProductionBatches();
      const bIndex = pBatches.findIndex(b => b.id === productionBatchId);
      if (bIndex >= 0) {
        pBatches[bIndex].qualityStatus = decision === 'approved' ? 'conforme' : 'rejeté';
        pBatches[bIndex].status = decision === 'approved' ? 'in_stock' : 'rejected';
        pBatches[bIndex].notes = safetyNotes;
        NakheelDB.saveProductionBatches(pBatches);
        if (decision === 'approved') {
          const inventoryList = NakheelDB.getInventory();
          const existingInv = inventoryList.find(i => i.productId === pBatches[bIndex].productId && i.productionBatchId === productionBatchId);
          if (existingInv) { existingInv.availableQuantityKg += pBatches[bIndex].producedQuantityKg; }
          else { inventoryList.unshift({ id: `INV-${genId()}`, productId: pBatches[bIndex].productId, productionBatchId, availableQuantityKg: pBatches[bIndex].producedQuantityKg, reservedQuantityKg: 0, soldQuantityKg: 0, damagedQuantityKg: 0, lastUpdated: new Date().toISOString().split('T')[0] }); }
          NakheelDB.saveInventory(inventoryList);
        }
      }
    }
    await reloadAllData();
    const notifDecision = decision === 'approved' ? 'conforme' : decision === 'rejected' ? 'rejeté' : 'à vérifier';
    const batch = batches.find(b => b.id === productionBatchId);
    notifyQualityResult(batch?.batchNumber ?? productionBatchId, notifDecision).catch(() => null);
    // Compute real quality score from the QC parameters (same logic as operator UI)
    const humidityScore  = Math.max(0, 100 - humidity * 5)   * 0.30; // <12% idéal
    const fiberScore     = Math.min(100, fiber * 5)           * 0.30; // >18% idéal
    const proteinScore   = Math.min(100, proteinTarget * 6)   * 0.25; // >14% idéal
    const impurityScore  = (impurityCheck ? 100 : 0)           * 0.15;
    const realScore      = Math.round(humidityScore + fiberScore + proteinScore + impurityScore);
    // Email to supplier whose waste contributed to this batch
    const supplierUser = users.find(u => u.role === 'supplier');
    if (supplierUser?.email) {
      emailQualityResult(supplierUser.email, supplierUser.fullName, batch?.batchNumber ?? productionBatchId, notifDecision, realScore).catch(() => null);
    }
  };

  const submitComplaint = async (
    clientId: string, orderId: string, productionBatchId: string, complaintType: ComplaintType, message: string
  ): Promise<void> => {
    const newComplaint: Complaint = {
      id: `COMP-${genId()}`, clientId, orderId, productionBatchId, complaintType, message,
      status: 'open', createdAt: new Date().toISOString().split('T')[0],
    };
    if (isSupabaseAvailable && sDB) {
      await sDB.upsertComplaint(newComplaint);
    } else {
      const list = NakheelDB.getComplaints(); list.unshift(newComplaint); NakheelDB.saveComplaints(list);
    }
    await reloadAllData();
    const clientUser = users.find(u => u.id === clientId);
    notifyComplaintReceived(clientUser?.fullName ?? 'Client').catch(() => null);
  };

  const replyToComplaint = async (id: string, reply: string): Promise<void> => {
    if (isSupabaseAvailable && sDB) {
      const c = complaints.find(c => c.id === id);
      if (c) await sDB.upsertComplaint({ ...c, status: 'resolved', reply });
    } else {
      const list = NakheelDB.getComplaints();
      const index = list.findIndex(c => c.id === id);
      if (index >= 0) { list[index].status = 'resolved'; list[index].reply = reply; NakheelDB.saveComplaints(list); }
    }
    await reloadAllData();
  };

  return (
    <NakheelContext.Provider value={{
      users, suppliers, clients, wasteRequests, rawMaterialBatches, products,
      batches, qualityChecks, inventory, orders, orderItems, complaints, aiPredictions,
      metrics, isLoading,
      addWasteRequest, updateWasteRequestStatus, evaluateWasteQuality,
      createOrder, confirmOrder, cancelOrder, deliverOrder, updateOrderStatus,
      createBatch, updateBatchStatus, saveQualityCheck, submitComplaint, replyToComplaint,
    }}>
      {children}
    </NakheelContext.Provider>
  );
};

export const useNakheel = () => {
  const context = useContext(NakheelContext);
  if (!context) throw new Error('useNakheel must be used within a NakheelProvider');
  return context;
};
