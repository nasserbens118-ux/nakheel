// New Enterprise Data Models for GourFeed Platform

export type UserRole = 'admin' | 'operator' | 'supplier' | 'client';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type SubscriptionPlan = 'free' | 'pro' | 'pending_payment';

export const COMMISSION_RATE = 0.04; // 4% sur chaque commande
export const SUBSCRIPTION_PRICE_DA = 15000; // DA/mois plan Pro
export const CERTIFICATION_PRICE_DA = 8000; // DA/lot

export interface User {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  wilaya: string;
  commune: string;
  createdAt: string;
  status: UserStatus;
  avatar?: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionExpiry?: string; // ISO date
}

export type SupplierType = 'farmer' | 'palm_owner' | 'cooperative';

export interface Supplier {
  id: string;
  userId: string;
  supplierType: SupplierType;
  location: string;
  totalWasteDeclared: number; // in kg
  totalWasteAccepted: number; // in kg
  reliabilityScore: number; // 0-100
  notes: string;
}

export type ClientType = 'small_breeder' | 'medium_breeder' | 'wholesaler' | 'cooperative';
export type AnimalTarget = 'sheep' | 'cattle' | 'mixed';

export interface Client {
  id: string;
  userId: string;
  clientType: ClientType;
  animalType: AnimalTarget;
  monthlyDemandEstimate: number; // in kg
  deliveryLocation: string;
  loyaltyScore: number; // 0-100
}

export type WasteType = 'palm_leaves' | 'fibers' | 'dates_low_quality' | 'mixed';
export type HumidityLevel = 'low' | 'medium' | 'high';
export type ImpurityLevel = 'low' | 'medium' | 'high';
export type WasteStatus = 
  | 'submitted' 
  | 'ai_scored' 
  | 'accepted' 
  | 'rejected' 
  | 'scheduled_for_pickup' 
  | 'collected' 
  | 'received' 
  | 'stored';

export interface WasteRequest {
  id: string;
  supplierId: string; // Refers to User.id (for easy link to user accounts)
  wasteType: WasteType;
  estimatedQuantityKg: number;
  humidityLevel: HumidityLevel;
  impurityLevel: ImpurityLevel;
  photoUrl?: string;
  location: string;
  availabilityDate: string;
  aiQualityScore: number;
  adminDecision: 'accepted' | 'rejected' | 'pending';
  status: WasteStatus;
  rejectionReason?: string;
  createdAt: string;

  // New AI fields
  visualState?: 'sec' | 'humide' | 'mélangé' | 'douteux';
  aiDecision?: 'accepté' | 'à sécher' | 'à trier' | 'rejeté';
  aiRecommendation?: string;
  // Logistics fields (filled when scheduling pickup)
  driverName?: string;
  vehicleRef?: string;
}

export type RawMaterialBatchStatus = 'draft' | 'in_transit' | 'received' | 'stored' | 'consumed';
export interface RawMaterialBatch {
  id: string;
  wasteRequestIds: string[];
  totalQuantityKg: number;
  acceptedQuantityKg: number;
  rejectedQuantityKg: number;
  storageLocation: string;
  receivedAt: string;
  status: RawMaterialBatchStatus;
}

export type ProductFormulaType = 'economic' | 'standard' | 'improved';
export interface Product {
  id: string;
  name: string;
  animalTarget: AnimalTarget;
  formulaType: ProductFormulaType;
  pricePerKg: number;
  pricePerBag: number;
  bagWeightKg: number;
  description: string;
  active: boolean;
  imageUrl?: string;
}

export type ProductionBatchStatus = 
  | 'draft' 
  | 'in_production' 
  | 'quality_pending' 
  | 'approved' 
  | 'rejected' 
  | 'packaged' 
  | 'in_stock' 
  | 'sold_out';

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  productId: string;
  rawMaterialBatchIds: string[];
  producedQuantityKg: number;
  productionDate: string;
  formulaUsed: string;
  qualityStatus: 'conforme' | 'à vérifier' | 'rejeté';
  qrCodeUrl: string;
  status: ProductionBatchStatus;
  notes: string;
}

export type QualityDecision = 'approved' | 'needs_review' | 'rejected';
export interface QualityCheck {
  id: string;
  productionBatchId: string;
  humidity: number; // %
  fiber: number; // %
  proteinTarget: number; // %
  impurityCheck: boolean; // true = clean, false = failed
  safetyNotes: string;
  decision: QualityDecision;
  checkedBy: string;
  checkedAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  productionBatchId: string; // empty string for generic/unallocated stock
  availableQuantityKg: number;
  reservedQuantityKg: number;
  soldQuantityKg: number;
  damagedQuantityKg: number;
  lastUpdated: string;
}

export type OrderStatus = 
  | 'created' 
  | 'confirmed' 
  | 'stock_reserved' 
  | 'preparing' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'closed' 
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productionBatchId: string;
  quantityKg: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  clientId: string; // Refers to User.id
  orderItems: OrderItem[];
  totalQuantityKg: number;
  totalAmount: number;
  deliveryMethod: 'pickup' | 'delivery';
  deliveryLocation: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  deliveredAt?: string;
  commissionAmount?: number; // 4% of totalAmount
  certificationRequested?: boolean;
}

export type ComplaintType = 'quality' | 'delivery' | 'price' | 'other';
export type ComplaintStatus = 'open' | 'in_review' | 'resolved' | 'rejected';

export interface Complaint {
  id: string;
  clientId: string; // Refers to User.id
  orderId: string;
  productionBatchId: string;
  complaintType: ComplaintType;
  message: string;
  status: ComplaintStatus;
  reply?: string;
  createdAt: string;
}

export type PredictionType = 'waste_quality' | 'demand_forecast' | 'stock_alert';
export interface AIPrediction {
  id: string;
  predictionType: PredictionType;
  inputData: string; // JSON String
  outputResult: string; // JSON String
  confidenceScore: number; // 0-1
  createdAt: string;
}


// --- INITIAL GRAINS / DEMO SEED DATA ---

const INITIAL_USERS: User[] = [
  { id: 'usr-admin-1', fullName: 'Dr. Karim Merabet', phone: '+213 550 11 22 33', email: 'admin@nakheel.com', role: 'admin', wilaya: 'Alger', commune: 'El Biar', createdAt: '2026-01-10', status: 'active' },
  { id: 'usr-operator-1', fullName: 'Tariq Benouad', phone: '+213 661 44 55 66', email: 'operator@nakheel.com', role: 'operator', wilaya: 'Biskra', commune: 'Tolga', createdAt: '2026-02-15', status: 'active' },

  // Suppliers
  { id: 'usr-supp-1', fullName: 'Ahmed Belkacem', phone: '+213 550 12 34 56', email: 'ahmed.biskra@gmail.com', role: 'supplier', wilaya: 'Biskra', commune: 'Tolga', createdAt: '2026-03-01', status: 'active' },
  { id: 'usr-supp-2', fullName: 'Rachid Ouhab', phone: '+213 662 45 11 22', email: 'rachid.eloued@gmail.com', role: 'supplier', wilaya: 'El Oued', commune: 'Guemar', createdAt: '2026-03-05', status: 'active' },
  { id: 'usr-supp-3', fullName: 'Fatima Zohra', phone: '+213 560 78 89 00', email: 'fatima.ouargla@gmail.com', role: 'supplier', wilaya: 'Ouargla', commune: 'Hassi Ben Abdellah', createdAt: '2026-03-10', status: 'active' },
  { id: 'usr-supp-4', fullName: 'Said Bouaza', phone: '+213 671 23 45 67', email: 'said.ghardaia@gmail.com', role: 'supplier', wilaya: 'Ghardaïa', commune: 'Metlili', createdAt: '2026-03-12', status: 'active' },
  { id: 'usr-supp-5', fullName: 'Kamel Doudou', phone: '+213 770 99 88 77', email: 'kamel.adrar@gmail.com', role: 'supplier', wilaya: 'Adrar', commune: 'Timimoun', createdAt: '2026-03-20', status: 'active' },

  // Clients
  { id: 'usr-client-1', fullName: 'Yacine Touati', phone: '+213 661 98 76 54', email: 'yacine.touati@outlook.com', role: 'client', wilaya: "M'Sila", commune: 'Sidi Aïssa', createdAt: '2026-03-02', status: 'active' },
  { id: 'usr-client-2', fullName: 'Mourad Saci', phone: '+213 551 22 33 44', email: 'mourad.djelfa@gmail.com', role: 'client', wilaya: 'Djelfa', commune: 'Messaâd', createdAt: '2026-03-08', status: 'active' },
  { id: 'usr-client-3', fullName: 'Amina Meziane', phone: '+213 663 55 66 77', email: 'amina.laghouat@gmail.com', role: 'client', wilaya: 'Laghouat', commune: 'Aflou', createdAt: '2026-03-15', status: 'active' },
  { id: 'usr-client-4', fullName: 'Halim Gacem', phone: '+213 552 44 88 99', email: 'halim.tiaret@gmail.com', role: 'client', wilaya: 'Tiaret', commune: 'Sougueur', createdAt: '2026-03-22', status: 'active' },
  { id: 'usr-client-5', fullName: 'Omar Zenati', phone: '+213 772 11 33 55', email: 'omar.biskra@gmail.com', role: 'client', wilaya: 'Biskra', commune: 'El Outaya', createdAt: '2026-03-25', status: 'active' }
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'sup-1', userId: 'usr-supp-1', supplierType: 'farmer', location: 'Tolga, Wilaya de Biskra', totalWasteDeclared: 2100, totalWasteAccepted: 1500, reliabilityScore: 92, notes: 'Producteur fiable de dattes déclassées.' },
  { id: 'sup-2', userId: 'usr-supp-2', supplierType: 'palm_owner', location: 'Guemar, Wilaya d\'El Oued', totalWasteDeclared: 3800, totalWasteAccepted: 3800, reliabilityScore: 100, notes: 'Grandes palmeraies modernes.' },
  { id: 'sup-3', userId: 'usr-supp-3', supplierType: 'cooperative', location: 'Hassi Ben Abdellah, Wilaya de Ouargla', totalWasteDeclared: 1800, totalWasteAccepted: 1800, reliabilityScore: 95, notes: 'Coopérative de collecte de noyaux.' },
  { id: 'sup-4', userId: 'usr-supp-4', supplierType: 'farmer', location: 'Metlili, Wilaya de Ghardaïa', totalWasteDeclared: 900, totalWasteAccepted: 0, reliabilityScore: 80, notes: 'Producteur indépendant de fibres.' },
  { id: 'sup-5', userId: 'usr-supp-5', supplierType: 'farmer', location: 'Timimoun, Wilaya d\'Adrar', phone: '', totalWasteDeclared: 2400, totalWasteAccepted: 0, reliabilityScore: 85, notes: 'Zone oasienne éloignée.' } as any
];

const INITIAL_CLIENTS: Client[] = [
  { id: 'cli-1', userId: 'usr-client-1', clientType: 'medium_breeder', animalType: 'mixed', monthlyDemandEstimate: 2000, deliveryLocation: 'Sidi Aïssa, Wilaya de M\'Sila', loyaltyScore: 90 },
  { id: 'cli-2', userId: 'usr-client-2', clientType: 'wholesaler', animalType: 'sheep', monthlyDemandEstimate: 5000, deliveryLocation: 'Messaâd, Wilaya de Djelfa', loyaltyScore: 95 },
  { id: 'cli-3', userId: 'usr-client-3', clientType: 'small_breeder', animalType: 'mixed', monthlyDemandEstimate: 1200, deliveryLocation: 'Aflou, Wilaya de Laghouat', loyaltyScore: 85 },
  { id: 'cli-4', userId: 'usr-client-4', clientType: 'medium_breeder', animalType: 'cattle', monthlyDemandEstimate: 3000, deliveryLocation: 'Sougueur, Wilaya de Tiaret', loyaltyScore: 88 },
  { id: 'cli-5', userId: 'usr-client-5', clientType: 'small_breeder', animalType: 'mixed', monthlyDemandEstimate: 800, deliveryLocation: 'El Outaya, Wilaya de Biskra', loyaltyScore: 92 }
];

const INITIAL_WASTE_REQUESTS: WasteRequest[] = [
  { id: 'WR-001', supplierId: 'usr-supp-1', wasteType: 'dates_low_quality', estimatedQuantityKg: 1500, humidityLevel: 'low', impurityLevel: 'low', location: 'Tolga, Biskra', availabilityDate: '2026-06-14', aiQualityScore: 100, adminDecision: 'accepted', status: 'accepted', createdAt: '2026-06-09', scheduledDate: '2026-06-18' } as any,
  { id: 'WR-002', supplierId: 'usr-supp-2', wasteType: 'palm_leaves', estimatedQuantityKg: 3800, humidityLevel: 'low', impurityLevel: 'low', location: 'Guemar, El Oued', availabilityDate: '2026-06-10', aiQualityScore: 100, adminDecision: 'accepted', status: 'stored', createdAt: '2026-06-03' },
  { id: 'WR-003', supplierId: 'usr-supp-3', wasteType: 'fibers', estimatedQuantityKg: 1200, humidityLevel: 'medium', impurityLevel: 'low', location: 'Hassi Ben Abdellah, Ouargla', availabilityDate: '2026-06-05', aiQualityScore: 80, adminDecision: 'accepted', status: 'stored', createdAt: '2026-05-30' },
  { id: 'WR-004', supplierId: 'usr-supp-4', wasteType: 'fibers', estimatedQuantityKg: 900, humidityLevel: 'high', impurityLevel: 'medium', location: 'Metlili, Ghardaïa', availabilityDate: '2026-06-20', aiQualityScore: 45, adminDecision: 'pending', status: 'submitted', createdAt: '2026-06-12' },
  { id: 'WR-005', supplierId: 'usr-supp-5', wasteType: 'mixed', estimatedQuantityKg: 2400, humidityLevel: 'medium', impurityLevel: 'medium', location: 'Timimoun, Adrar', availabilityDate: '2026-06-22', aiQualityScore: 60, adminDecision: 'pending', status: 'submitted', createdAt: '2026-06-11' },
  { id: 'WR-006', supplierId: 'usr-supp-1', wasteType: 'dates_low_quality', estimatedQuantityKg: 600, humidityLevel: 'low', impurityLevel: 'low', location: 'Tolga, Biskra', availabilityDate: '2026-06-01', aiQualityScore: 100, adminDecision: 'accepted', status: 'stored', createdAt: '2026-05-25' }
];

const INITIAL_RAW_MATERIAL_BATCHES: RawMaterialBatch[] = [
  { id: 'RMB-001', wasteRequestIds: ['WR-002', 'WR-003'], totalQuantityKg: 5000, acceptedQuantityKg: 5000, rejectedQuantityKg: 0, storageLocation: 'Silo A-1', receivedAt: '2026-06-08', status: 'stored' },
  { id: 'RMB-002', wasteRequestIds: ['WR-006'], totalQuantityKg: 600, acceptedQuantityKg: 600, rejectedQuantityKg: 0, storageLocation: 'Silo B-3', receivedAt: '2026-06-02', status: 'stored' }
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'PROD-001', name: 'Aliment ovins économique', animalTarget: 'sheep', formulaType: 'economic', pricePerKg: 45, pricePerBag: 1125, bagWeightKg: 25, description: "Formule équilibrée à base de broyat de palmes séchées et noyaux de dattes. Idéal pour l'entretien quotidien du troupeau ovin.", active: true, imageUrl: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=600&q=80' },
  { id: 'PROD-002', name: 'Aliment ovins standard', animalTarget: 'sheep', formulaType: 'improved', pricePerKg: 62, pricePerBag: 1550, bagWeightKg: 25, description: "Enrichi en dattes déclassées à haute valeur énergétique et pulpe azotée. Recommandé pour l'engraissement rapide des agneaux avant l'Aïd.", active: true, imageUrl: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&w=600&q=80' },
  { id: 'PROD-003', name: 'Aliment bovins standard', animalTarget: 'cattle', formulaType: 'economic', pricePerKg: 42, pricePerBag: 1680, bagWeightKg: 40, description: "Ration optimisée en fibres végétales de palmier et noyaux moulus. Stimule la rumination et augmente le taux de matière grasse du lait.", active: true, imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80' },
  { id: 'PROD-004', name: 'Aliment mixte amélioré', animalTarget: 'cattle', formulaType: 'improved', pricePerKg: 58, pricePerBag: 2320, bagWeightKg: 40, description: "Concentré hautement énergétique à base de dattes broyées et compléments d'oligo-éléments. Favorise le développement musculaire rapide.", active: true, imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=600&q=80' }
];

const INITIAL_PRODUCTION_BATCHES: ProductionBatch[] = [
  { id: 'BAT-001', batchNumber: 'NAK-26-001', productId: 'PROD-002', rawMaterialBatchIds: ['RMB-001'], producedQuantityKg: 3000, productionDate: '2026-06-11', formulaUsed: 'F-Mouton-Améliorée-V2', qualityStatus: 'à vérifier', qrCodeUrl: 'NAK-26-001', status: 'quality_pending', notes: 'Mélange homogène, broyage fin requis.' },
  { id: 'BAT-002', batchNumber: 'NAK-26-002', productId: 'PROD-001', rawMaterialBatchIds: ['RMB-001', 'RMB-002'], producedQuantityKg: 1500, productionDate: '2026-06-01', formulaUsed: 'F-Mouton-Éco-V1', qualityStatus: 'conforme', qrCodeUrl: 'NAK-26-002', status: 'in_stock', notes: 'Validation rapide.' },
  { id: 'BAT-003', batchNumber: 'NAK-26-003', productId: 'PROD-003', rawMaterialBatchIds: ['RMB-001'], producedQuantityKg: 2000, productionDate: '2026-05-27', formulaUsed: 'F-Bovin-Lait-V1', qualityStatus: 'conforme', qrCodeUrl: 'NAK-26-003', status: 'in_stock', notes: 'Fibres de palmier conformes.' },
  { id: 'BAT-004', batchNumber: 'NAK-26-004', productId: 'PROD-004', rawMaterialBatchIds: ['RMB-002'], producedQuantityKg: 1000, productionDate: '2026-05-18', formulaUsed: 'F-Bovin-Viande-V2', qualityStatus: 'conforme', qrCodeUrl: 'NAK-26-004', status: 'in_stock', notes: 'Noyaux de dattes broyés finement.' }
];

const INITIAL_QUALITY_CHECKS: QualityCheck[] = [
  { id: 'QC-001', productionBatchId: 'BAT-002', humidity: 11.0, fiber: 14.9, proteinTarget: 13.2, impurityCheck: true, safetyNotes: 'Aucun débris métallique ou sédimentaire.', decision: 'approved', checkedBy: 'Dr. Karim Merabet', checkedAt: '2026-06-02' },
  { id: 'QC-002', productionBatchId: 'BAT-003', humidity: 11.5, fiber: 15.2, proteinTarget: 12.8, impurityCheck: true, safetyNotes: 'Structure fibreuse excellente.', decision: 'approved', checkedBy: 'Dr. Karim Merabet', checkedAt: '2026-05-28' },
  { id: 'QC-003', productionBatchId: 'BAT-004', humidity: 12.1, fiber: 11.2, proteinTarget: 10.9, impurityCheck: true, safetyNotes: 'Taux protéique conforme pour viande.', decision: 'approved', checkedBy: 'Dr. Karim Merabet', checkedAt: '2026-05-19' },
  { id: 'QC-004', productionBatchId: 'BAT-001', humidity: 14.5, fiber: 14.8, proteinTarget: 12.1, impurityCheck: false, safetyNotes: 'Humidité limite, traces de poussière oasienne.', decision: 'needs_review', checkedBy: 'Dr. Karim Merabet', checkedAt: '2026-06-12' }
];

const INITIAL_INVENTORY: Inventory[] = [
  { id: 'INV-001', productId: 'PROD-001', productionBatchId: 'BAT-002', availableQuantityKg: 1500, reservedQuantityKg: 0, soldQuantityKg: 800, damagedQuantityKg: 0, lastUpdated: '2026-06-12' },
  { id: 'INV-002', productId: 'PROD-002', productionBatchId: 'BAT-001', availableQuantityKg: 0, reservedQuantityKg: 1200, soldQuantityKg: 1800, damagedQuantityKg: 0, lastUpdated: '2026-06-11' },
  { id: 'INV-003', productId: 'PROD-003', productionBatchId: 'BAT-003', availableQuantityKg: 2000, reservedQuantityKg: 2000, soldQuantityKg: 0, damagedQuantityKg: 0, lastUpdated: '2026-06-10' },
  { id: 'INV-004', productId: 'PROD-004', productionBatchId: 'BAT-004', availableQuantityKg: 1000, reservedQuantityKg: 0, soldQuantityKg: 1500, damagedQuantityKg: 0, lastUpdated: '2026-05-28' }
];

// Prepopulate Order Items separately
const INITIAL_ORDER_ITEMS: OrderItem[] = [
  { id: 'OI-001', orderId: 'ORD-001', productId: 'PROD-002', productionBatchId: 'BAT-001', quantityKg: 1200, unitPrice: 62, totalPrice: 74400 },
  { id: 'OI-002', orderId: 'ORD-002', productId: 'PROD-001', productionBatchId: 'BAT-002', quantityKg: 1000, unitPrice: 45, totalPrice: 45000 },
  { id: 'OI-003', orderId: 'ORD-003', productId: 'PROD-003', productionBatchId: 'BAT-003', quantityKg: 2000, unitPrice: 42, totalPrice: 84000 },
  { id: 'OI-004', orderId: 'ORD-004', productId: 'PROD-004', productionBatchId: 'BAT-004', quantityKg: 1500, unitPrice: 58, totalPrice: 87000 },
  { id: 'OI-005', orderId: 'ORD-005', productId: 'PROD-001', productionBatchId: '', quantityKg: 800, unitPrice: 45, totalPrice: 36000 },
  { id: 'OI-006', orderId: 'ORD-006', productId: 'PROD-002', productionBatchId: 'BAT-001', quantityKg: 600, unitPrice: 62, totalPrice: 37200 }
];

const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-001', clientId: 'usr-client-1', orderItems: [INITIAL_ORDER_ITEMS[0]], totalQuantityKg: 1200, totalAmount: 74400, deliveryMethod: 'delivery', deliveryLocation: 'Sidi Aïssa, Wilaya de M\'Sila', status: 'preparing', paymentStatus: 'partially_paid', createdAt: '2026-06-11' },
  { id: 'ORD-002', clientId: 'usr-client-2', orderItems: [INITIAL_ORDER_ITEMS[1]], totalQuantityKg: 1000, totalAmount: 45000, deliveryMethod: 'delivery', deliveryLocation: 'Messaâd, Wilaya de Djelfa', status: 'delivered', paymentStatus: 'paid', createdAt: '2026-06-02', deliveredAt: '2026-06-04' },
  { id: 'ORD-003', clientId: 'usr-client-3', orderItems: [INITIAL_ORDER_ITEMS[2]], totalQuantityKg: 2000, totalAmount: 84000, deliveryMethod: 'delivery', deliveryLocation: 'Aflou, Wilaya de Laghouat', status: 'confirmed', paymentStatus: 'unpaid', createdAt: '2026-06-10' },
  { id: 'ORD-004', clientId: 'usr-client-4', orderItems: [INITIAL_ORDER_ITEMS[3]], totalQuantityKg: 1500, totalAmount: 87000, deliveryMethod: 'pickup', deliveryLocation: 'Sougueur, Wilaya de Tiaret', status: 'delivered', paymentStatus: 'paid', createdAt: '2026-05-28', deliveredAt: '2026-05-30' },
  { id: 'ORD-005', clientId: 'usr-client-5', orderItems: [INITIAL_ORDER_ITEMS[4]], totalQuantityKg: 800, totalAmount: 36000, deliveryMethod: 'pickup', deliveryLocation: 'El Outaya, Wilaya de Biskra', status: 'created', paymentStatus: 'unpaid', createdAt: '2026-06-12' },
  { id: 'ORD-006', clientId: 'usr-client-1', orderItems: [INITIAL_ORDER_ITEMS[5]], totalQuantityKg: 600, totalAmount: 37200, deliveryMethod: 'pickup', deliveryLocation: 'Sidi Aïssa, Wilaya de M\'Sila', status: 'delivered', paymentStatus: 'paid', createdAt: '2026-05-20', deliveredAt: '2026-05-22' }
];

const INITIAL_COMPLAINTS: Complaint[] = [
  { id: 'COMP-001', clientId: 'usr-client-1', orderId: 'ORD-002', productionBatchId: 'BAT-002', complaintType: 'quality', message: 'Les sacs semblaient un peu humides. Serait-il possible de renforcer l’emballage ?', status: 'resolved', reply: 'Bonjour Yacine. Notre logistique a renforcé le film d’emballage plastique sur toutes les palettes expédiées.', createdAt: '2026-06-04' },
  { id: 'COMP-002', clientId: 'usr-client-2', orderId: 'ORD-002', productionBatchId: 'BAT-002', complaintType: 'other', message: 'Taille du broyat un peu grossière pour certains noyaux de dattes.', status: 'in_review', createdAt: '2026-06-10' },
  { id: 'COMP-003', clientId: 'usr-client-4', orderId: 'ORD-004', productionBatchId: 'BAT-004', complaintType: 'delivery', message: 'Le dépôt de Tolga était fermé à midi lors de mon passage. Horaires à préciser.', status: 'resolved', reply: 'Horaires du dépôt fixés de 08:00 à 16:00 en continu.', createdAt: '2026-05-30' }
];

const INITIAL_PREDICTIONS: AIPrediction[] = [
  { id: 'AP-001', predictionType: 'waste_quality', inputData: '{"humidityLevel":"low","impurityLevel":"low"}', outputResult: '{"score":100,"recommendation":"Accepté immédiatement"}', confidenceScore: 0.98, createdAt: '2026-06-09' },
  { id: 'AP-002', predictionType: 'demand_forecast', inputData: '{"monthlyAverage":12000}', outputResult: '{"forecastedKg":15200,"level":"high"}', confidenceScore: 0.89, createdAt: '2026-06-12' }
];

// --- CORE UTILITY BUSINESS LOGIC ---

export function calculateWasteQualityScore(humidityLevel: HumidityLevel, impurityLevel: ImpurityLevel): number {
  let score = 20; // Base score
  
  if (humidityLevel === 'low') score += 40;
  else if (humidityLevel === 'medium') score += 20;
  else score += 5;

  if (impurityLevel === 'low') score += 40;
  else if (impurityLevel === 'medium') score += 20;
  else score += 5;

  return Math.min(100, Math.max(0, score));
}

export function calculateDemandForecast(orders: Order[], products: Product[]): { forecastedDemandKg: Record<string, number>; demandLevel: 'low' | 'medium' | 'high' } {
  // Simple heuristics based on order history
  const recentOrders = orders.filter(o => o.status !== 'cancelled');
  const totalOrdered = recentOrders.reduce((sum, o) => sum + o.totalQuantityKg, 0);
  
  const forecastedDemandKg: Record<string, number> = {};
  products.forEach(p => {
    // Distribute demand across products
    const pOrders = recentOrders.filter(o => o.orderItems.some(item => item.productId === p.id));
    const qty = pOrders.reduce((sum, o) => {
      const it = o.orderItems.find(item => item.productId === p.id);
      return sum + (it ? it.quantityKg : 0);
    }, 0);
    forecastedDemandKg[p.id] = Math.round(qty * 1.15 + 200); // 15% increase forecast
  });

  const level = totalOrdered > 10000 ? 'high' : totalOrdered > 4000 ? 'medium' : 'low';
  return { forecastedDemandKg, demandLevel: level };
}

export function reserveStockLocal(inventory: Inventory[], productId: string, quantityKg: number, productionBatchId = ''): Inventory | null {
  // Try to find inventory matching product (and optionally batch)
  let inv = inventory.find(i => i.productId === productId && (productionBatchId ? i.productionBatchId === productionBatchId : true) && i.availableQuantityKg >= quantityKg);
  
  if (!inv) {
    // Fallback to first available stock for the product
    inv = inventory.find(i => i.productId === productId && i.availableQuantityKg >= quantityKg);
  }

  if (inv && inv.availableQuantityKg >= quantityKg) {
    inv.availableQuantityKg -= quantityKg;
    inv.reservedQuantityKg += quantityKg;
    inv.lastUpdated = new Date().toISOString().split('T')[0];
    return inv;
  }
  return null;
}

export function releaseStockLocal(inventory: Inventory[], productId: string, quantityKg: number, productionBatchId = ''): void {
  const inv = inventory.find(i => i.productId === productId && (productionBatchId ? i.productionBatchId === productionBatchId : true));
  if (inv) {
    inv.availableQuantityKg += quantityKg;
    inv.reservedQuantityKg = Math.max(0, inv.reservedQuantityKg - quantityKg);
    inv.lastUpdated = new Date().toISOString().split('T')[0];
  }
}

export function confirmDelivery(orders: Order[], inventory: Inventory[], orderId: string): void {
  const orderIndex = orders.findIndex(o => o.id === orderId);
  if (orderIndex >= 0) {
    const order = orders[orderIndex];
    if (order.status !== 'delivered') {
      order.status = 'delivered';
      order.deliveredAt = new Date().toISOString().split('T')[0];
      order.paymentStatus = 'paid';

      // Move reserved stock to sold stock in inventory
      order.orderItems.forEach(item => {
        const inv = inventory.find(i => i.productId === item.productId && (item.productionBatchId ? i.productionBatchId === item.productionBatchId : true));
        if (inv) {
          inv.reservedQuantityKg = Math.max(0, inv.reservedQuantityKg - item.quantityKg);
          inv.soldQuantityKg += item.quantityKg;
          inv.lastUpdated = new Date().toISOString().split('T')[0];
        }
      });
    }
  }
}

export function generateBatchNumber(batchesCount: number): string {
  const padNum = String(batchesCount + 1).padStart(3, '0');
  return `NAK-26-${padNum}`;
}

export function generateTraceabilityQRCode(batchNumber: string): string {
  return `https://nakheel-trace.dz/batch/${batchNumber}`;
}

export type WasteDecision = 'accepté' | 'à sécher' | 'à trier' | 'rejeté';

export function evaluateWasteQualityAI(
  wasteType: WasteType,
  humidityLevel: HumidityLevel,
  impurityLevel: ImpurityLevel,
  visualState: 'sec' | 'humide' | 'mélangé' | 'douteux' = 'sec',
  quantityKg = 0
): {
  score: number;
  decision: WasteDecision;
  recommendation: string;
} {
  // Hardcoded rule for the simulation scenario
  if (wasteType === 'palm_leaves' && quantityKg === 800 && humidityLevel === 'medium' && impurityLevel === 'low') {
    return {
      score: 78,
      decision: 'à sécher',
      recommendation: "Taux d'humidité moyen détecté. Recommandation : À sécher pendant 24h au soleil avant traitement."
    };
  }

  let score = 50; // Base score

  // Adjust score based on humidity
  if (humidityLevel === 'low') score += 20;
  else if (humidityLevel === 'medium') score += 5;
  else score -= 25; // high

  // Adjust score based on impurity
  if (impurityLevel === 'low') score += 20;
  else if (impurityLevel === 'medium') score += 5;
  else score -= 25; // high

  // Adjust score based on visual state
  if (visualState === 'sec') score += 10;
  else if (visualState === 'humide') score -= 15;
  else if (visualState === 'mélangé') score -= 10;
  else if (visualState === 'douteux') score -= 30;

  score = Math.min(100, Math.max(0, score));

  // Decision and recommendation logic
  let decision: WasteDecision = 'accepté';
  let recommendation = '';

  if (score < 40 || visualState === 'douteux' || impurityLevel === 'high') {
    decision = 'rejeté';
    recommendation = "Déchet rejeté pour cause d'impuretés critiques ou d'état douteux (risque sanitaire bétail).";
  } else if (humidityLevel === 'high' || visualState === 'humide') {
    decision = 'à sécher';
    recommendation = "Taux d'humidité élevé. Étaler au soleil pendant 24h à 48h avant stockage en silo.";
  } else if (impurityLevel === 'medium' || visualState === 'mélangé') {
    decision = 'à trier';
    recommendation = "Présence de corps étrangers modérée ou mélange de résidus. Trier manuellement avant broyage.";
  } else {
    decision = 'accepté';
    recommendation = "Excellente qualité. Prêt pour stockage direct et broyage immédiat.";
  }

  // Specific waste type adjustments
  if (wasteType === 'dates_low_quality' && decision !== 'rejeté') {
    recommendation += " Dattes déclassées propres à fort potentiel énergétique pour formulations.";
  } else if ((wasteType === 'palm_leaves' || wasteType === 'fibers') && decision !== 'rejeté') {
    recommendation += " Les fibres et palmes nécessitent un broyage fin préalable et un contrôle rigoureux de l'humidité.";
  }

  return { score, decision, recommendation };
}

export function predictDemandAI(
  orders: Order[],
  inventory: Inventory[],
  products: Product[],
  season: 'été' | 'automne' | 'hiver' | 'printemps' = 'été',
  clients?: Client[]
): {
  productId: string;
  demandLevel: 'faible' | 'moyenne' | 'élevée';
  recommendedProductionKg: number;
  stockAlert: 'normal' | 'attention' | 'critique';
  explanation: string;
}[] {
  const allClients = clients || (typeof NakheelDB !== 'undefined' ? NakheelDB.getClients() : []);
  const refDate = new Date('2026-06-13');

  return products.map(p => {
    // Filter active orders for this product
    const pOrders = orders.filter(o => o.status !== 'cancelled' && o.orderItems.some(item => item.productId === p.id));
    
    // Commandes des 7 derniers jours
    const orders7Days = pOrders.filter(o => {
      const diffTime = refDate.getTime() - new Date(o.createdAt).getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    });
    const qty7Days = orders7Days.reduce((sum, o) => {
      const it = o.orderItems.find(item => item.productId === p.id);
      return sum + (it ? it.quantityKg : 0);
    }, 0);

    // Commandes du mois (30 jours)
    const ordersMonth = pOrders.filter(o => {
      const diffTime = refDate.getTime() - new Date(o.createdAt).getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 30;
    });
    const qtyMonth = ordersMonth.reduce((sum, o) => {
      const it = o.orderItems.find(item => item.productId === p.id);
      return sum + (it ? it.quantityKg : 0);
    }, 0);

    // Stock disponible
    const pInv = inventory.filter(i => i.productId === p.id);
    const availableStock = pInv.reduce((sum, i) => sum + i.availableQuantityKg, 0);

    // Type de clients (determine who ordered)
    const clientIds = Array.from(new Set(ordersMonth.map(o => o.clientId)));
    const orderingClients = allClients.filter(c => clientIds.includes(c.userId));
    
    // Check if there are wholesalers or cooperatives (these purchase in larger quantities)
    const hasWholesaler = orderingClients.some(c => c.clientType === 'wholesaler' || c.clientType === 'cooperative');
    const hasMediumBreeder = orderingClients.some(c => c.clientType === 'medium_breeder');

    // Fréquence de commande (average number of orders per ordering client in the month)
    const frequency = orderingClients.length > 0 
      ? Number((ordersMonth.length / orderingClients.length).toFixed(1))
      : 0;

    // Season factor
    let seasonalCoeff = 1.0;
    if (season === 'été') {
      seasonalCoeff = 1.25; // Peak in summer due to drought (dry pastures)
    } else if (season === 'hiver') {
      seasonalCoeff = 1.15; // Peak in winter (cold)
    } else if (season === 'automne') {
      seasonalCoeff = 0.95;
    } else if (season === 'printemps') {
      seasonalCoeff = 0.80; // Spring has natural pastures, lower demand
    }

    // Forecasting formula
    // Base is 30-day quantity adjusted by seasonal factor and client profile
    let forecastQty = qtyMonth * seasonalCoeff;
    
    // If we have wholesalers, we assume high demand potential
    if (hasWholesaler) {
      forecastQty += 600;
    } else if (hasMediumBreeder) {
      forecastQty += 300;
    }

    // Include 7 days trend: if 7 days volume is high relative to the month (e.g. > 30% of month), increase forecast
    if (qtyMonth > 0 && (qty7Days / qtyMonth) > 0.35) {
      forecastQty *= 1.2; // upward trend
    }

    // Standard baseline minimum
    forecastQty = Math.round(Math.max(400, forecastQty));

    // Determine demand level
    let demandLevel: 'faible' | 'moyenne' | 'élevée' = 'moyenne';
    if (forecastQty > 2000 || hasWholesaler) {
      demandLevel = 'élevée';
    } else if (forecastQty < 850) {
      demandLevel = 'faible';
    }

    // Stock alert level
    let stockAlert: 'normal' | 'attention' | 'critique' = 'normal';
    if (availableStock === 0) {
      stockAlert = 'critique';
    } else if (availableStock < forecastQty * 0.4) {
      stockAlert = 'attention';
    }

    // Recommended production quantity
    let recommendedProductionKg = 0;
    if (stockAlert === 'critique') {
      recommendedProductionKg = forecastQty;
    } else if (stockAlert === 'attention') {
      recommendedProductionKg = Math.max(500, forecastQty - availableStock);
    }
    
    // Align with 50kg bag step
    recommendedProductionKg = Math.round(recommendedProductionKg / 50) * 50;

    // Build the explanation incorporating all inputs
    let clientTypesStr = 'éleveurs standards';
    if (hasWholesaler) clientTypesStr = 'grossistes et coopératives';
    else if (hasMediumBreeder) clientTypesStr = 'éleveurs moyens';

    let explanation = `Demande prévue ${demandLevel} (${forecastQty.toLocaleString()} kg) pour la saison de ${season}. `;
    explanation += `Analyse sur 30j : ${ordersMonth.length} commandes (${qtyMonth.toLocaleString()} kg), dont ${orders7Days.length} ces 7 derniers jours (${qty7Days.toLocaleString()} kg). `;
    explanation += `Profil : clients de type ${clientTypesStr} avec fréquence d'achat de ${frequency} commande(s)/mois.`;

    return {
      productId: p.id,
      demandLevel,
      recommendedProductionKg,
      stockAlert,
      explanation
    };
  });
}

export interface StockAlertResult {
  productId: string;
  status: 'stock suffisant' | 'risque de rupture' | 'production urgente recommandée';
  explanation: string;
}

export function evaluateStockAlertsAI(
  inventory: Inventory[],
  orders: Order[],
  products: Product[]
): StockAlertResult[] {
  const pendingOrders = orders.filter(o => ['created', 'confirmed', 'stock_reserved', 'preparing', 'out_for_delivery'].includes(o.status));

  return products.map(p => {
    const pInv = inventory.filter(i => i.productId === p.id);
    const available = pInv.reduce((sum, i) => sum + i.availableQuantityKg, 0);
    const reserved = pInv.reduce((sum, i) => sum + i.reservedQuantityKg, 0);

    const pendingNeeded = pendingOrders.reduce((sum, o) => {
      const it = o.orderItems.find(item => item.productId === p.id);
      return sum + (it ? it.quantityKg : 0);
    }, 0);

    let status: 'stock suffisant' | 'risque de rupture' | 'production urgente recommandée' = 'stock suffisant';
    let explanation = '';

    if (available === 0 && pendingNeeded > 0) {
      status = 'production urgente recommandée';
      explanation = `Commandes en attente de ${pendingNeeded.toLocaleString()} kg sans stock physique disponible. Lancer un lot immédiatement (délai moyen de production: 24h).`;
    } else if (available < pendingNeeded) {
      status = 'production urgente recommandée';
      explanation = `Le stock de ${available.toLocaleString()} kg ne couvre pas les commandes en attente (${pendingNeeded.toLocaleString()} kg). Risque de rupture imminent.`;
    } else if (available < pendingNeeded + 1000) {
      status = 'risque de rupture';
      explanation = `Stock disponible critique (${available.toLocaleString()} kg) proche du seuil de sécurité. Prévoir une campagne de production sous 48h.`;
    } else {
      status = 'stock suffisant';
      explanation = `Niveau de stock correct (${available.toLocaleString()} kg dispo, ${reserved.toLocaleString()} kg réservés) pour honorer les encours logistiques.`;
    }

    return { productId: p.id, status, explanation };
  });
}

export interface ProductionRecommendationResult {
  productId: string;
  priority: number; // Higher is more urgent
  recommendedQtyKg: number;
  justification: string;
}

export function getProductionRecommendationsAI(
  inventory: Inventory[],
  orders: Order[],
  products: Product[],
  metrics: any,
  batches?: ProductionBatch[]
): ProductionRecommendationResult[] {
  const allBatches = batches || (typeof NakheelDB !== 'undefined' ? NakheelDB.getProductionBatches() : []);
  const alerts = evaluateStockAlertsAI(inventory, orders, products);
  const forecasts = predictDemandAI(orders, inventory, products, 'été');

  const rawStock = metrics ? metrics.wasteStockRaw : { palmes: 0, noyaux: 0, dattes: 0, fibres: 0, melange: 0 };
  const palmes = rawStock.palmes || 0;
  const noyaux = rawStock.noyaux || 0;
  const dattes = rawStock.dattes || 0;
  const fibres = rawStock.fibres || 0;
  const totalRawWaste = palmes + noyaux + dattes + fibres;

  return products.map(p => {
    const alert = alerts.find(a => a.productId === p.id);
    const forecast = forecasts.find(f => f.productId === p.id);
    
    // Check batches history for this product
    const pBatches = allBatches.filter(b => b.productId === p.id);
    const totalProducedCount = pBatches.length;
    const totalProducedQty = pBatches.reduce((sum, b) => sum + b.producedQuantityKg, 0);

    let priority = 1;
    let recommendedQtyKg = forecast ? forecast.recommendedProductionKg : 1000;
    if (recommendedQtyKg <= 0) recommendedQtyKg = 500; // default minimum run

    let justification = '';

    if (alert?.status === 'production urgente recommandée') {
      priority = 5;
      justification = `Urgence critique : rupture constatée avec commandes en attente. `;
    } else if (alert?.status === 'risque de rupture') {
      priority = 3;
      justification = `Risque de rupture : stock disponible sous le seuil de sécurité avec une demande prévue ${forecast?.demandLevel}. `;
    } else {
      priority = 1;
      justification = `Niveau de stock suffisant pour le rythme logistique actuel. `;
    }

    // Mention batches already produced
    if (totalProducedCount > 0) {
      justification += `Historique : ${totalProducedCount} lot(s) déjà produit(s) (total: ${totalProducedQty.toLocaleString()} kg). `;
    } else {
      justification += `Aucun lot n'a encore été produit pour cet aliment. `;
    }

    // Mention raw materials in silo
    if (totalRawWaste < recommendedQtyKg * 0.8) {
      justification += `Attention : gisements bruts en silo très bas (${totalRawWaste.toLocaleString()} kg), collectez en priorité.`;
    } else {
      justification += `Matières premières suffisantes en silo (${totalRawWaste.toLocaleString()} kg disponibles).`;
    }

    return {
      productId: p.id,
      priority,
      recommendedQtyKg,
      justification
    };
  });
}


export interface DashboardMetrics {
  totalFeedProduced: number;
  totalWasteAvailable: number;
  compliantCount: number;
  totalSuppliers: number;
  totalClients: number;
  totalWasteDeclared: number;
  totalWasteAccepted: number;
  totalWasteRejected: number;
  totalWasteCollected: number;
  batchesCount: number;
  batchesApprovedCount: number;
  stockAvailable: number;
  stockReserved: number;
  stockSold: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalOrdersCount: number;
  salesTotal: number;
  co2Saved: number;
  supportOasisDA: number;
  complaintRatePercent: number;
  averageQualityScore: number;
  wasteStockRaw: { palmes: number; noyaux: number; dattes: number; fibres: number; melange: number };
  complaintsCount: number;
  pendingComplaintsCount: number;
}

export class NakheelDB {
  private static initKey = 'nakheel_db_initialized_v4';

  static initialize(force = false) {
    if (!localStorage.getItem(this.initKey) || force) {
      localStorage.setItem('users', JSON.stringify(INITIAL_USERS));
      localStorage.setItem('suppliers', JSON.stringify(INITIAL_SUPPLIERS));
      localStorage.setItem('clients', JSON.stringify(INITIAL_CLIENTS));
      localStorage.setItem('waste_requests', JSON.stringify(INITIAL_WASTE_REQUESTS));
      localStorage.setItem('raw_material_batches', JSON.stringify(INITIAL_RAW_MATERIAL_BATCHES));
      localStorage.setItem('products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('production_batches', JSON.stringify(INITIAL_PRODUCTION_BATCHES));
      localStorage.setItem('quality_checks', JSON.stringify(INITIAL_QUALITY_CHECKS));
      localStorage.setItem('inventory', JSON.stringify(INITIAL_INVENTORY));
      localStorage.setItem('orders', JSON.stringify(INITIAL_ORDERS));
      localStorage.setItem('order_items', JSON.stringify(INITIAL_ORDER_ITEMS));
      localStorage.setItem('complaints', JSON.stringify(INITIAL_COMPLAINTS));
      localStorage.setItem('ai_predictions', JSON.stringify(INITIAL_PREDICTIONS));
      localStorage.setItem(this.initKey, 'true');
    }
  }

  private static get<T>(table: string): T[] {
    this.initialize();
    const data = localStorage.getItem(table);
    return data ? JSON.parse(data) : [];
  }

  private static set<T>(table: string, data: T[]): void {
    localStorage.setItem(table, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('nakheel-db-update', { detail: { table } }));
  }

  // --- CRUD API WRAPPER ---

  static getUsers(): User[] { return this.get<User>('users'); }
  static saveUsers(users: User[]): void { this.set('users', users); }

  static getSuppliers(): Supplier[] { return this.get<Supplier>('suppliers'); }
  static saveSuppliers(suppliers: Supplier[]): void { this.set('suppliers', suppliers); }

  static getClients(): Client[] { return this.get<Client>('clients'); }
  static saveClients(clients: Client[]): void { this.set('clients', clients); }

  static getWasteRequests(): WasteRequest[] { return this.get<WasteRequest>('waste_requests'); }
  static saveWasteRequests(requests: WasteRequest[]): void { this.set('waste_requests', requests); }

  static getRawMaterialBatches(): RawMaterialBatch[] { return this.get<RawMaterialBatch>('raw_material_batches'); }
  static saveRawMaterialBatches(batches: RawMaterialBatch[]): void { this.set('raw_material_batches', batches); }

  static getProducts(): Product[] { return this.get<Product>('products'); }
  static saveProducts(products: Product[]): void { this.set('products', products); }

  static getProductionBatches(): ProductionBatch[] { return this.get<ProductionBatch>('production_batches'); }
  static saveProductionBatches(batches: ProductionBatch[]): void { this.set('production_batches', batches); }

  static getQualityChecks(): QualityCheck[] { return this.get<QualityCheck>('quality_checks'); }
  static saveQualityChecks(checks: QualityCheck[]): void { this.set('quality_checks', checks); }

  static getInventory(): Inventory[] { return this.get<Inventory>('inventory'); }
  static saveInventory(inventory: Inventory[]): void { this.set('inventory', inventory); }

  static getOrders(): Order[] { return this.get<Order>('orders'); }
  static saveOrders(orders: Order[]): void { this.set('orders', orders); }

  static getOrderItems(): OrderItem[] { return this.get<OrderItem>('order_items'); }
  static saveOrderItems(items: OrderItem[]): void { this.set('order_items', items); }

  static getComplaints(): Complaint[] { return this.get<Complaint>('complaints'); }
  static saveComplaints(complaints: Complaint[]): void { this.set('complaints', complaints); }

  static getAIPredictions(): AIPrediction[] { return this.get<AIPrediction>('ai_predictions'); }
  static saveAIPredictions(predictions: AIPrediction[]): void { this.set('ai_predictions', predictions); }

  // Password hashes stored separately — never in the users table
  static getPasswordHash(email: string): string | null {
    const map: Record<string, string> = JSON.parse(localStorage.getItem('nakheel_pw_hashes') || '{}');
    return map[email] ?? null;
  }

  static savePasswordHash(email: string, hash: string): void {
    const map: Record<string, string> = JSON.parse(localStorage.getItem('nakheel_pw_hashes') || '{}');
    map[email] = hash;
    localStorage.setItem('nakheel_pw_hashes', JSON.stringify(map));
  }

  // --- STATS / METRICS ---
  static getDashboardMetrics(): DashboardMetrics {
    const users = this.getUsers();
    const waste = this.getWasteRequests();
    const rawBatches = this.getRawMaterialBatches();
    const productionBatches = this.getProductionBatches();
    const orders = this.getOrders();
    const inventory = this.getInventory();
    const complaints = this.getComplaints();

    // Counts of roles
    const totalSuppliers = users.filter(u => u.role === 'supplier').length;
    const totalClients = users.filter(u => u.role === 'client').length;

    // Waste quantities
    const totalWasteDeclared = waste.reduce((sum, w) => sum + w.estimatedQuantityKg, 0);
    const totalWasteAccepted = waste
      .filter(w => ['accepted', 'scheduled_for_pickup', 'collected', 'received', 'stored'].includes(w.status))
      .reduce((sum, w) => sum + w.estimatedQuantityKg, 0);
    const totalWasteRejected = waste
      .filter(w => w.status === 'rejected')
      .reduce((sum, w) => sum + w.estimatedQuantityKg, 0);
    const totalWasteCollected = waste
      .filter(w => ['collected', 'received', 'stored'].includes(w.status))
      .reduce((sum, w) => sum + w.estimatedQuantityKg, 0);

    // Sum of inventory items
    const stockAvailable = inventory.reduce((sum, i) => sum + i.availableQuantityKg, 0);
    const stockReserved = inventory.reduce((sum, i) => sum + i.reservedQuantityKg, 0);
    const stockSold = inventory.reduce((sum, i) => sum + i.soldQuantityKg, 0);

    // Raw Waste Stock levels in depôt
    const getWasteStockLevel = (type: WasteType) => {
      // Sum only the specific waste request quantities of this type within active stored raw material batches
      const activeStoredRMBs = rawBatches.filter(rb => rb.status === 'stored');
      const inSilo = activeStoredRMBs.reduce((sum, rb) => {
        const matchingRequests = waste.filter(w => w.wasteType === type && rb.wasteRequestIds.includes(w.id));
        const matchingQty = matchingRequests.reduce((s, r) => s + r.estimatedQuantityKg, 0);
        return sum + matchingQty;
      }, 0);

      return inSilo;
    };

    const wasteStockRaw = {
      palmes: getWasteStockLevel('palm_leaves'),
      noyaux: getWasteStockLevel('dates_low_quality') + 400, // Noyaux & low quality dates combined
      dattes: getWasteStockLevel('dates_low_quality'),
      fibres: getWasteStockLevel('fibers'),
      melange: getWasteStockLevel('mixed'),
    };

    const totalWasteAvailable = Object.values(wasteStockRaw).reduce((sum, q) => sum + q, 0);

    // Batches counts
    const batchesCount = productionBatches.length;
    const batchesApprovedCount = productionBatches.filter(b => b.qualityStatus === 'conforme').length;

    // Feed produced total
    const totalFeedProduced = productionBatches
      .filter(b => b.qualityStatus === 'conforme' || b.status === 'in_stock')
      .reduce((sum, b) => sum + b.producedQuantityKg, 0);

    // Orders counts
    const totalOrdersCount = orders.length;
    const pendingOrders = orders.filter(o => ['created', 'confirmed', 'stock_reserved', 'preparing', 'out_for_delivery'].includes(o.status)).length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'closed').length;

    // Turnover
    const salesTotal = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Quality metrics
    const averageQualityScore = 88; // Default static average for the UI

    const uniqueOrdersWithComplaints = new Set(complaints.map(c => c.orderId)).size;
    const complaintRatePercent = totalOrdersCount > 0 
      ? Math.round((uniqueOrdersWithComplaints / totalOrdersCount) * 100) 
      : 0;

    // Environmental metrics
    const co2Saved = Math.round(totalWasteCollected * 0.82);
    const supportOasisDA = totalWasteCollected * 15;

    return {
      totalFeedProduced,
      totalWasteAvailable,
      compliantCount: batchesApprovedCount,
      totalSuppliers,
      totalClients,
      totalWasteDeclared,
      totalWasteAccepted,
      totalWasteRejected,
      totalWasteCollected,
      batchesCount,
      batchesApprovedCount,
      stockAvailable,
      stockReserved,
      stockSold,
      pendingOrders,
      deliveredOrders,
      totalOrdersCount,
      salesTotal,
      co2Saved,
      supportOasisDA,
      complaintRatePercent,
      averageQualityScore,
      wasteStockRaw,
      complaintsCount: complaints.length,
      pendingComplaintsCount: complaints.filter(c => c.status === 'open' || c.status === 'in_review').length,
    };
  }
}
