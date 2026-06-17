import { supabase as _supabase } from './supabaseClient';
// backendActions is only called when Supabase is configured — assert non-null.
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const supabase = _supabase!;

export interface QualityScoreResult {
  score: number;
  decision: string;
  recommendation: string;
}

export interface DashboardMetrics {
  totalWasteCollected: number;
  totalFeedProduced: number;
  co2Saved: number;
  supportOasisDA: number;
  wasteStockRaw: {
    palmes: number;
    noyaux: number;
    dattes: number;
    fibres: number;
    melange: number;
  };
}

/**
 * 1. Calculate waste quality score using public.calculate_waste_quality_score
 */
export async function calculateWasteQualityScore(
  humidityLevel: 'low' | 'medium' | 'high',
  impurityLevel: 'low' | 'medium' | 'high',
  visualState: 'dry' | 'wet' | 'mixed' | 'doubtful' = 'dry',
  wasteType: 'palm_leaves' | 'fibers' | 'low_quality_dates' | 'mixed' = 'palm_leaves',
  quantityKg: number = 0
): Promise<QualityScoreResult> {
  const { data, error } = await supabase.rpc('calculate_waste_quality_score', {
    humidity: humidityLevel,
    impurity: impurityLevel,
    visual: visualState,
    w_type: wasteType,
    qty: quantityKg
  });

  if (error) {
    throw new Error(`Failed to calculate waste quality score: ${error.message}`);
  }

  return data as QualityScoreResult;
}

/**
 * 2. Accept Waste Request
 */
export async function acceptWasteRequest(requestId: string, adminId: string): Promise<void> {
  const { error } = await supabase.rpc('accept_waste_request', {
    request_id: requestId,
    admin_id: adminId
  });

  if (error) {
    throw new Error(`Failed to accept waste request: ${error.message}`);
  }
}

/**
 * 3. Reject Waste Request
 */
export async function rejectWasteRequest(requestId: string, adminId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc('reject_waste_request', {
    request_id: requestId,
    admin_id: adminId,
    reason: reason
  });

  if (error) {
    throw new Error(`Failed to reject waste request: ${error.message}`);
  }
}

/**
 * 4. Schedule Collection
 */
export async function scheduleCollection(
  requestId: string,
  scheduledDate: string,
  driverName: string,
  vehicleRef: string
): Promise<string> {
  const { data, error } = await supabase.rpc('schedule_collection', {
    request_id: requestId,
    scheduled_date: scheduledDate,
    driver_name: driverName,
    vehicle_ref: vehicleRef
  });

  if (error) {
    throw new Error(`Failed to schedule collection: ${error.message}`);
  }

  return data as string;
}

/**
 * 5. Receive Raw Material
 */
export async function receiveRawMaterial(
  requestIds: string[],
  batchCode: string,
  storageLocation: string
): Promise<string> {
  const { data, error } = await supabase.rpc('receive_raw_material', {
    request_ids: requestIds,
    batch_code: batchCode,
    storage_location: storageLocation
  });

  if (error) {
    throw new Error(`Failed to receive raw material: ${error.message}`);
  }

  return data as string;
}

/**
 * 6. Create Production Batch
 */
export async function createProductionBatch(
  productId: string,
  rawMaterialBatchIds: string[],
  producedQty: number,
  formulaUsed: string
): Promise<string> {
  const { data, error } = await supabase.rpc('create_production_batch', {
    p_id: productId,
    raw_material_batch_ids: rawMaterialBatchIds,
    produced_qty: producedQty,
    formula: formulaUsed
  });

  if (error) {
    throw new Error(`Failed to create production batch: ${error.message}`);
  }

  return data as string;
}

/**
 * 7. Add Quality Check
 */
export async function addQualityCheck(
  batchId: string,
  humidity: number,
  fiber: number,
  proteinTarget: number,
  impurityCheck: boolean,
  safetyNotes: string,
  decision: 'approved' | 'needs_review' | 'rejected',
  checkedBy: string
): Promise<string> {
  const { data, error } = await supabase.rpc('add_quality_check', {
    batch_id: batchId,
    humidity,
    fiber,
    protein: proteinTarget,
    impurity_check: impurityCheck,
    safety_notes: safetyNotes,
    decision,
    checked_by: checkedBy
  });

  if (error) {
    throw new Error(`Failed to add quality check: ${error.message}`);
  }

  return data as string;
}

/**
 * 8. Approve Production Batch
 */
export async function approveProductionBatch(batchId: string): Promise<void> {
  const { error } = await supabase.rpc('approve_production_batch', {
    batch_id: batchId
  });

  if (error) {
    throw new Error(`Failed to approve production batch: ${error.message}`);
  }
}

/**
 * 9. Update Inventory After Production
 */
export async function updateInventoryAfterProduction(batchId: string, quantity: number): Promise<void> {
  const { error } = await supabase.rpc('update_inventory_after_production', {
    batch_id: batchId,
    quantity
  });

  if (error) {
    throw new Error(`Failed to update inventory after production: ${error.message}`);
  }
}

/**
 * 10. Reserve Stock
 */
export async function reserveStock(orderId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('reserve_stock', {
    order_id: orderId
  });

  if (error) {
    throw new Error(`Failed to reserve stock: ${error.message}`);
  }

  return data as boolean;
}

/**
 * 11. Release Stock
 */
export async function releaseStock(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('release_stock', {
    order_id: orderId
  });

  if (error) {
    throw new Error(`Failed to release stock: ${error.message}`);
  }
}

/**
 * 12. Confirm Order
 */
export async function confirmOrder(orderId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('confirm_order', {
    order_id: orderId
  });

  if (error) {
    throw new Error(`Failed to confirm order: ${error.message}`);
  }

  return data as boolean;
}

/**
 * 13. Cancel Order
 */
export async function cancelOrder(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_order', {
    order_id: orderId
  });

  if (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }
}

/**
 * 14. Confirm Delivery
 */
export async function confirmDelivery(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('confirm_delivery', {
    order_id: orderId
  });

  if (error) {
    throw new Error(`Failed to confirm delivery: ${error.message}`);
  }
}

/**
 * 15. Generate Batch Number
 */
export async function generateBatchNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_batch_number');

  if (error) {
    throw new Error(`Failed to generate batch number: ${error.message}`);
  }

  return data as string;
}

/**
 * 16. Generate Order Number
 */
export async function generateOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_order_number');

  if (error) {
    throw new Error(`Failed to generate order number: ${error.message}`);
  }

  return data as string;
}

/**
 * 17. Generate Traceability QR Code
 */
export async function generateTraceabilityQRCode(batchNumber: string): Promise<string> {
  const { data, error } = await supabase.rpc('generate_traceability_qr_code', {
    batch_number: batchNumber
  });

  if (error) {
    throw new Error(`Failed to generate traceability QR code: ${error.message}`);
  }

  return data as string;
}

/**
 * 18. Calculate Dashboard Metrics
 */
export async function calculateDashboardMetrics(): Promise<DashboardMetrics> {
  const { data, error } = await supabase.rpc('calculate_dashboard_metrics');

  if (error) {
    throw new Error(`Failed to calculate dashboard metrics: ${error.message}`);
  }

  return data as DashboardMetrics;
}

/**
 * 19. Create Complaint
 */
export async function createComplaint(
  clientId: string,
  orderId: string,
  batchId: string,
  complaintType: 'quality' | 'delivery' | 'price' | 'other',
  message: string
): Promise<string> {
  const { data, error } = await supabase.rpc('create_complaint', {
    client_id: clientId,
    order_id: orderId,
    batch_id: batchId,
    complaint_type: complaintType,
    message: message
  });

  if (error) {
    throw new Error(`Failed to create complaint: ${error.message}`);
  }

  return data as string;
}
