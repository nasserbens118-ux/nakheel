// Supabase async data layer — mirrors NakheelDB but persists to Postgres
import { supabase } from './supabaseClient';
import type {
  User, UserRole, Supplier, Client, WasteRequest, RawMaterialBatch,
  Product, ProductionBatch, QualityCheck, Inventory, Order, OrderItem,
  Complaint, AIPrediction, DashboardMetrics, HumidityLevel, ImpurityLevel
} from './db';

// Guard: all exports below are only called when isSupabaseAvailable is true.
// Moving the check inside a function avoids crashing the module on import in demo mode.
const db = supabase;

// ─── Storage bucket auto-creation ────────────────────────────────────────────
// Called once on first Supabase connection. Creates `nakheel-uploads` if absent.
export async function ensureStorageBucket(): Promise<void> {
  try {
    const { data: buckets } = await db!.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'nakheel-uploads');
    if (!exists) {
      await db!.storage.createBucket('nakheel-uploads', {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
    }
  } catch {
    // Non-blocking: if bucket creation fails (e.g. insufficient RLS perms),
    // photo upload will fall back to base64 gracefully.
  }
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapProfile(p: Record<string, unknown>): User {
  return {
    id:        p.id as string,
    fullName:  p.full_name as string,
    phone:     (p.phone as string) ?? '',
    email:     p.email as string,
    role:      p.role as UserRole,
    wilaya:    (p.wilaya as string) ?? '',
    commune:   (p.commune as string) ?? '',
    createdAt: p.created_at as string,
    status:             (p.status as 'active' | 'inactive' | 'pending') ?? 'active',
    avatar:             p.avatar as string | undefined,
    subscriptionPlan:   (p.subscription_plan as import('./db').SubscriptionPlan) ?? 'free',
    subscriptionExpiry: p.subscription_expiry as string | undefined,
  };
}

function mapSupplier(s: Record<string, unknown>): Supplier {
  return {
    id:                   s.id as string,
    userId:               s.user_id as string,
    supplierType:         s.supplier_type as Supplier['supplierType'],
    location:             (s.location as string) ?? '',
    totalWasteDeclared:   Number(s.total_waste_declared ?? 0),
    totalWasteAccepted:   Number(s.total_waste_accepted ?? 0),
    reliabilityScore:     Number(s.reliability_score ?? 0),
    notes:                (s.notes as string) ?? '',
  };
}

function mapClient(c: Record<string, unknown>): Client {
  return {
    id:                    c.id as string,
    userId:                c.user_id as string,
    clientType:            c.client_type as Client['clientType'],
    animalType:            c.animal_type as Client['animalType'],
    monthlyDemandEstimate: Number(c.monthly_demand_estimate ?? 0),
    deliveryLocation:      (c.delivery_location as string) ?? '',
    loyaltyScore:          Number(c.loyalty_score ?? 0),
  };
}

function mapWasteRequest(w: Record<string, unknown>): WasteRequest {
  return {
    id:                   w.id as string,
    supplierId:           w.supplier_id as string,
    wasteType:            w.waste_type as WasteRequest['wasteType'],
    estimatedQuantityKg:  Number(w.estimated_quantity_kg),
    humidityLevel:        w.humidity_level as HumidityLevel,
    impurityLevel:        w.impurity_level as ImpurityLevel,
    photoUrl:             w.photo_url as string | undefined,
    location:             (w.location as string) ?? '',
    availabilityDate:     w.availability_date as string,
    aiQualityScore:       Number(w.ai_quality_score ?? 0),
    adminDecision:        w.admin_decision as WasteRequest['adminDecision'],
    status:               w.status as WasteRequest['status'],
    rejectionReason:      w.rejection_reason as string | undefined,
    createdAt:            w.created_at as string,
    visualState:          w.visual_state as WasteRequest['visualState'],
    aiDecision:           w.ai_decision as WasteRequest['aiDecision'],
    aiRecommendation:     w.ai_recommendation as string | undefined,
  };
}

function mapRawBatch(r: Record<string, unknown>): RawMaterialBatch {
  return {
    id:                  r.id as string,
    wasteRequestIds:     (r.waste_request_ids as string[]) ?? [],
    totalQuantityKg:     Number(r.total_quantity_kg ?? 0),
    acceptedQuantityKg:  Number(r.accepted_quantity_kg ?? 0),
    rejectedQuantityKg:  Number(r.rejected_quantity_kg ?? 0),
    storageLocation:     (r.storage_location as string) ?? '',
    receivedAt:          r.received_at as string,
    status:              r.status as RawMaterialBatch['status'],
  };
}

function mapProduct(p: Record<string, unknown>): Product {
  return {
    id:           p.id as string,
    name:         p.name as string,
    animalTarget: p.animal_target as Product['animalTarget'],
    formulaType:  p.formula_type as Product['formulaType'],
    pricePerKg:   Number(p.price_per_kg),
    pricePerBag:  Number(p.price_per_bag),
    bagWeightKg:  Number(p.bag_weight_kg),
    description:  (p.description as string) ?? '',
    active:       Boolean(p.active),
    imageUrl:     p.image_url as string | undefined,
  };
}

function mapBatch(b: Record<string, unknown>): ProductionBatch {
  return {
    id:                  b.id as string,
    batchNumber:         b.batch_number as string,
    productId:           b.product_id as string,
    rawMaterialBatchIds: (b.raw_material_batch_ids as string[]) ?? [],
    producedQuantityKg:  Number(b.produced_quantity_kg),
    productionDate:      b.production_date as string,
    formulaUsed:         (b.formula_used as string) ?? '',
    qualityStatus:       b.quality_status as ProductionBatch['qualityStatus'],
    qrCodeUrl:           (b.qr_code_url as string) ?? '',
    status:              b.status as ProductionBatch['status'],
    notes:               (b.notes as string) ?? '',
  };
}

function mapQC(q: Record<string, unknown>): QualityCheck {
  return {
    id:                 q.id as string,
    productionBatchId:  q.production_batch_id as string,
    humidity:           Number(q.humidity),
    fiber:              Number(q.fiber),
    proteinTarget:      Number(q.protein_target),
    impurityCheck:      Boolean(q.impurity_check),
    safetyNotes:        (q.safety_notes as string) ?? '',
    decision:           q.decision as QualityCheck['decision'],
    checkedBy:          (q.checked_by as string) ?? '',
    checkedAt:          q.checked_at as string,
  };
}

function mapInventory(i: Record<string, unknown>): Inventory {
  return {
    id:                  i.id as string,
    productId:           i.product_id as string,
    productionBatchId:   (i.production_batch_id as string) ?? '',
    availableQuantityKg: Number(i.available_quantity_kg ?? 0),
    reservedQuantityKg:  Number(i.reserved_quantity_kg ?? 0),
    soldQuantityKg:      Number(i.sold_quantity_kg ?? 0),
    damagedQuantityKg:   Number(i.damaged_quantity_kg ?? 0),
    lastUpdated:         i.last_updated as string,
  };
}

function mapOrderItem(i: Record<string, unknown>): OrderItem {
  return {
    id:                 i.id as string,
    orderId:            i.order_id as string,
    productId:          i.product_id as string,
    productionBatchId:  (i.production_batch_id as string) ?? '',
    quantityKg:         Number(i.quantity_kg),
    unitPrice:          Number(i.unit_price),
    totalPrice:         Number(i.total_price),
  };
}

function mapOrder(o: Record<string, unknown>): Order {
  const items = Array.isArray(o.order_items)
    ? (o.order_items as Record<string, unknown>[]).map(mapOrderItem)
    : [];
  return {
    id:               o.id as string,
    clientId:         o.client_id as string,
    orderItems:       items,
    totalQuantityKg:  Number(o.total_quantity_kg),
    totalAmount:      Number(o.total_amount),
    deliveryMethod:   o.delivery_method as Order['deliveryMethod'],
    deliveryLocation: (o.delivery_location as string) ?? '',
    status:           o.status as Order['status'],
    paymentStatus:    o.payment_status as Order['paymentStatus'],
    createdAt:            o.created_at as string,
    deliveredAt:          o.delivered_at as string | undefined,
    commissionAmount:     o.commission_amount != null ? Number(o.commission_amount) : undefined,
    certificationRequested: Boolean(o.certification_requested ?? false),
  };
}

function mapComplaint(c: Record<string, unknown>): Complaint {
  return {
    id:                 c.id as string,
    clientId:           c.client_id as string,
    orderId:            c.order_id as string,
    productionBatchId:  (c.production_batch_id as string) ?? '',
    complaintType:      c.complaint_type as Complaint['complaintType'],
    message:            c.message as string,
    status:             c.status as Complaint['status'],
    reply:              c.reply as string | undefined,
    createdAt:          c.created_at as string,
  };
}

// ─── Reads ───────────────────────────────────────────────────────────────────

export async function getUsers(): Promise<User[]> {
  const { data, error } = await db!.from('profiles').select('*');
  if (error) throw error;
  return (data ?? []).map(mapProfile);
}

export async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await db!.from('suppliers').select('*');
  if (error) throw error;
  return (data ?? []).map(mapSupplier);
}

export async function getClients(): Promise<Client[]> {
  const { data, error } = await db!.from('clients').select('*');
  if (error) throw error;
  return (data ?? []).map(mapClient);
}

export async function getWasteRequests(): Promise<WasteRequest[]> {
  const { data, error } = await db!.from('waste_requests').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapWasteRequest);
}

export async function getRawMaterialBatches(): Promise<RawMaterialBatch[]> {
  const { data, error } = await db!.from('raw_material_batches').select('*');
  if (error) throw error;
  return (data ?? []).map(mapRawBatch);
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await db!.from('products').select('*');
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductionBatches(): Promise<ProductionBatch[]> {
  const { data, error } = await db!.from('production_batches').select('*').order('production_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapBatch);
}

export async function getQualityChecks(): Promise<QualityCheck[]> {
  const { data, error } = await db!.from('quality_checks').select('*');
  if (error) throw error;
  return (data ?? []).map(mapQC);
}

export async function getInventory(): Promise<Inventory[]> {
  const { data, error } = await db!.from('inventory').select('*');
  if (error) throw error;
  return (data ?? []).map(mapInventory);
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await db!.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function getOrderItems(): Promise<OrderItem[]> {
  const { data, error } = await db!.from('order_items').select('*');
  if (error) throw error;
  return (data ?? []).map(mapOrderItem);
}

export async function getComplaints(): Promise<Complaint[]> {
  const { data, error } = await db!.from('complaints').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapComplaint);
}

export async function getAIPredictions(): Promise<AIPrediction[]> {
  const { data, error } = await db!.from('ai_predictions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(p => ({
    id:              p.id as string,
    predictionType:  p.prediction_type as AIPrediction['predictionType'],
    inputData:       typeof p.input_data === 'object' ? JSON.stringify(p.input_data) : String(p.input_data ?? ''),
    outputResult:    typeof p.output_result === 'object' ? JSON.stringify(p.output_result) : String(p.output_result ?? ''),
    confidenceScore: Number(p.confidence_score ?? 0),
    createdAt:       p.created_at as string,
  }));
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { data, error } = await db!.rpc('calculate_dashboard_metrics');
  if (error) throw error;
  return data as DashboardMetrics;
}

// ─── Writes ──────────────────────────────────────────────────────────────────

export async function upsertWasteRequest(req: WasteRequest): Promise<void> {
  const { error } = await db!.from('waste_requests').upsert({
    id:                   req.id,
    supplier_id:          req.supplierId,
    waste_type:           req.wasteType,
    estimated_quantity_kg: req.estimatedQuantityKg,
    humidity_level:       req.humidityLevel,
    impurity_level:       req.impurityLevel,
    photo_url:            req.photoUrl ?? null,
    location:             req.location,
    availability_date:    req.availabilityDate,
    ai_quality_score:     req.aiQualityScore,
    admin_decision:       req.adminDecision,
    status:               req.status,
    rejection_reason:     req.rejectionReason ?? null,
    visual_state:         req.visualState ?? null,
    ai_decision:          req.aiDecision ?? null,
    ai_recommendation:    req.aiRecommendation ?? null,
  });
  if (error) throw error;
}

export async function upsertRawMaterialBatch(b: RawMaterialBatch): Promise<void> {
  const { error } = await db!.from('raw_material_batches').upsert({
    id:                   b.id,
    waste_request_ids:    b.wasteRequestIds,
    total_quantity_kg:    b.totalQuantityKg,
    accepted_quantity_kg: b.acceptedQuantityKg,
    rejected_quantity_kg: b.rejectedQuantityKg,
    storage_location:     b.storageLocation,
    status:               b.status,
  });
  if (error) throw error;
}

export async function upsertProductionBatch(b: ProductionBatch): Promise<void> {
  const { error } = await db!.from('production_batches').upsert({
    id:                    b.id,
    batch_number:          b.batchNumber,
    product_id:            b.productId,
    raw_material_batch_ids: b.rawMaterialBatchIds,
    produced_quantity_kg:  b.producedQuantityKg,
    production_date:       b.productionDate,
    formula_used:          b.formulaUsed,
    quality_status:        b.qualityStatus,
    qr_code_url:           b.qrCodeUrl,
    status:                b.status,
    notes:                 b.notes,
  });
  if (error) throw error;
}

export async function upsertQualityCheck(q: QualityCheck): Promise<void> {
  const { error } = await db!.from('quality_checks').upsert({
    id:                  q.id,
    production_batch_id: q.productionBatchId,
    humidity:            q.humidity,
    fiber:               q.fiber,
    protein_target:      q.proteinTarget,
    impurity_check:      q.impurityCheck,
    safety_notes:        q.safetyNotes,
    decision:            q.decision,
    checked_by:          q.checkedBy,
  });
  if (error) throw error;
}

export async function upsertInventory(i: Inventory): Promise<void> {
  const { error } = await db!.from('inventory').upsert({
    id:                   i.id,
    product_id:           i.productId,
    production_batch_id:  i.productionBatchId || null,
    available_quantity_kg: i.availableQuantityKg,
    reserved_quantity_kg:  i.reservedQuantityKg,
    sold_quantity_kg:      i.soldQuantityKg,
    damaged_quantity_kg:   i.damagedQuantityKg,
  });
  if (error) throw error;
}

export async function upsertOrder(order: Order): Promise<void> {
  const { error } = await db!.from('orders').upsert({
    id:               order.id,
    client_id:        order.clientId,
    total_quantity_kg: order.totalQuantityKg,
    total_amount:     order.totalAmount,
    delivery_method:  order.deliveryMethod,
    delivery_location: order.deliveryLocation,
    status:                  order.status,
    payment_status:          order.paymentStatus,
    delivered_at:            order.deliveredAt ?? null,
    commission_amount:       order.commissionAmount ?? null,
    certification_requested: order.certificationRequested ?? false,
  });
  if (error) throw error;

  for (const item of order.orderItems) {
    const { error: ie } = await db!.from('order_items').upsert({
      id:                  item.id,
      order_id:            item.orderId,
      product_id:          item.productId,
      production_batch_id: item.productionBatchId || null,
      quantity_kg:         item.quantityKg,
      unit_price:          item.unitPrice,
      total_price:         item.totalPrice,
    });
    if (ie) throw ie;
  }
}

export async function upsertComplaint(c: Complaint): Promise<void> {
  const { error } = await db!.from('complaints').upsert({
    id:                  c.id,
    client_id:           c.clientId,
    order_id:            c.orderId,
    production_batch_id: c.productionBatchId || null,
    complaint_type:      c.complaintType,
    message:             c.message,
    status:              c.status,
    reply:               c.reply ?? null,
  });
  if (error) throw error;
}

export async function upsertAIPrediction(p: AIPrediction): Promise<void> {
  const { error } = await db!.from('ai_predictions').upsert({
    id:               p.id,
    prediction_type:  p.predictionType,
    input_data:       JSON.parse(p.inputData),
    output_result:    JSON.parse(p.outputResult),
    confidence_score: p.confidenceScore,
  });
  if (error) throw error;
}

export async function updateSupplierStats(userId: string, delta: { declared?: number; accepted?: number }): Promise<void> {
  if (delta.declared) {
    await db!.rpc('update_supplier_declared', { uid: userId, qty: delta.declared });
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(email: string, password: string): Promise<User> {
  const { data, error } = await db!.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const { data: profile, error: pe } = await db!.from('profiles').select('*').eq('id', data.user.id).single();
  if (pe) throw pe;
  return mapProfile(profile as Record<string, unknown>);
}

export async function signUp(
  email: string,
  password: string,
  meta: { fullName: string; phone: string; role: UserRole; wilaya: string; commune: string }
): Promise<User> {
  const { data, error } = await db!.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: meta.fullName, role: meta.role },
    },
  });
  if (error) throw error;

  // The trigger handle_new_user inserts a minimal profile; we update with full data.
  const { error: ue } = await db!.from('profiles').update({
    full_name: meta.fullName,
    phone:     meta.phone,
    role:      meta.role,
    wilaya:    meta.wilaya,
    commune:   meta.commune,
    status:    'pending',
  }).eq('id', data.user!.id);
  if (ue) throw ue;

  return {
    id:               data.user!.id,
    fullName:         meta.fullName,
    phone:            meta.phone,
    email,
    role:             meta.role,
    wilaya:           meta.wilaya,
    commune:          meta.commune,
    createdAt:        new Date().toISOString(),
    status:           'pending',
    subscriptionPlan: 'free',
  };
}

export async function signOut(): Promise<void> {
  const { error } = await db!.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await db!.auth.getUser();
  if (!user) return null;
  const { data: profile } = await db!.from('profiles').select('*').eq('id', user.id).single();
  return profile ? mapProfile(profile as Record<string, unknown>) : null;
}
