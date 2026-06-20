// GourFeed AI Decision Support System Simulation
// Compatible with Google AI Studio prompt structures and local heuristic fallbacks

export interface OptimizeRecipeRequest {
  targetCategory: 'ovins' | 'bovins';
  formulaType: 'économique' | 'améliorée';
  availableStocks: {
    palmes: number;
    noyaux: number;
    dattes: number;
    fibres: number;
  };
}

export interface OptimizedRecipeResult {
  composition: {
    palmes: number; // %
    noyaux: number;  // %
    dattes: number;  // %
    fibres: number;  // %
    additifs: number; // % (vitamines, azote oasien)
  };
  nutritionalAnalysis: {
    proteinRate: number; // %
    moistureRate: number; // %
    fiberRate: number; // %
    energyValue: number; // UFL/kg
  };
  estimatedCostPerKg: number; // DA
  aiRecommendations: string[];
}

export interface RegionForecast {
  wilaya: string;
  currentAvailableEstimate: number; // tons
  forecastNext3Months: number; // tons
  mainWasteType: string;
  logisticalRisk: 'Faible' | 'Moyen' | 'Élevé';
}

export interface QualityRiskPrediction {
  batchId: string;
  riskScore: number; // 0 to 100
  potentialFailures: string[];
  recommendedActions: string[];
  predictedCompliance: 'Conforme' | 'Non Conforme' | 'À Risque';
}

export class NakheelAIService {
  
  /**
   * Optimise la formulation de l'aliment en fonction des stocks disponibles de déchets
   * et des contraintes nutritionnelles de la cible.
   */
  static optimizeRecipe(request: OptimizeRecipeRequest): OptimizedRecipeResult {
    const { targetCategory, formulaType, availableStocks } = request;
    
    // Heuristiques d'optimisation basées sur les stocks réels
    // Plus un stock est grand, plus le modèle pousse son usage dans la limite de la charte nutritionnelle
    const totalStock = availableStocks.palmes + availableStocks.noyaux + availableStocks.dattes + availableStocks.fibres;
    
    // Ratios par défaut
    let palmes = 40;
    let noyaux = 30;
    let dattes = 20;
    let fibres = 5;
    let additifs = 5;

    // Logique adaptative selon stock
    if (totalStock > 0) {
      const pRatio = availableStocks.palmes / totalStock;
      const nRatio = availableStocks.noyaux / totalStock;
      const dRatio = availableStocks.dattes / totalStock;

      if (pRatio > 0.4) {
        palmes = formulaType === 'économique' ? 55 : 45;
      }
      if (nRatio > 0.3) {
        noyaux = 35;
      }
      if (dRatio > 0.3) {
        dattes = formulaType === 'améliorée' ? 35 : 25;
      }
    }

    // Ajustements selon cible et type
    if (targetCategory === 'bovins') {
      // Les bovins ont besoin de plus de fibres structurelles
      fibres += 5;
      palmes = Math.max(20, palmes - 5);
    }
    
    if (formulaType === 'améliorée') {
      // Formule améliorée augmente le taux de dattes déclassées (sucre, énergie) et d'additifs azotés
      dattes = Math.max(30, dattes + 10);
      palmes = Math.max(15, palmes - 10);
      additifs = 8;
    }

    // Normaliser à 100%
    const sum = palmes + noyaux + dattes + fibres + additifs;
    palmes = Math.round((palmes / sum) * 100);
    noyaux = Math.round((noyaux / sum) * 100);
    dattes = Math.round((dattes / sum) * 100);
    fibres = Math.round((fibres / sum) * 100);
    additifs = 100 - (palmes + noyaux + dattes + fibres);

    // Calculs nutritionnels résultants
    const proteinRate = Number((
      (palmes * 0.05) + // 5% protéine dans les palmes
      (noyaux * 0.07) + // 7% dans les noyaux
      (dattes * 0.04) +  // 4% dans les dattes
      (fibres * 0.02) + // 2% dans les fibres
      (additifs * 1.1)  // additifs protéinés concentrates
    ).toFixed(1));

    // Moisture derived from composition: dattes and noyaux carry more moisture than palmes sèches
    const moistureRate = Number(Math.min(13, 10 + (noyaux * 0.03) + (dattes * 0.05)).toFixed(1));
    const fiberRate = Number(((palmes * 0.32) + (fibres * 0.45) + (noyaux * 0.15)).toFixed(1));
    const energyValue = Number((0.75 + (dattes * 0.005) + (noyaux * 0.002)).toFixed(2));

    // Calcul du coût estimé (DA par Kg)
    // Palmes = 10DA, Noyaux = 15DA, Dattes = 25DA, Fibres = 8DA, Additifs = 120DA
    const rawCost = (
      (palmes * 10) +
      (noyaux * 15) +
      (dattes * 25) +
      (fibres * 8) +
      (additifs * 120)
    ) / 100;
    const estimatedCostPerKg = Math.round(rawCost * 1.3); // +30% frais de broyage, d'énergie et marge

    // Recommandations IA générées dynamiquement
    const aiRecommendations: string[] = [];
    if (dattes > 30) {
      aiRecommendations.push("Taux de sucre élevé issu des dattes. Veiller à une introduction progressive dans la ration pour éviter le risque d'acidose chez les ruminants.");
    }
    if (palmes > 50) {
      aiRecommendations.push("Haute teneur en palmes broyées. Assurer un broyage fin à 2-3 mm maximum pour maximiser l'ingestibilité et éviter le tri par le bétail.");
    }
    if (availableStocks.dattes < 500 && formulaType === 'améliorée') {
      aiRecommendations.push("Alerte Stock : Le niveau de dattes déclassées est faible. Pousser les collectes à Biskra ou substituer partiellement par de la mélasse.");
    }
    aiRecommendations.push(`Formule optimisée en azote non-protéique via l'additif oasien (${additifs}%) pour cibler un taux de protéines de ${proteinRate}%.`);

    return {
      composition: { palmes, noyaux, dattes, fibres, additifs },
      nutritionalAnalysis: { proteinRate, moistureRate, fiberRate, energyValue },
      estimatedCostPerKg,
      aiRecommendations
    };
  }

  /**
   * Retourne les prévisions géographiques de gisement de déchets
   */
  static getRegionForecasts(): RegionForecast[] {
    return [
      { wilaya: 'Biskra (Tolga / El Outaya)', currentAvailableEstimate: 120, forecastNext3Months: 350, mainWasteType: 'Dattes déclassées & Noyaux', logisticalRisk: 'Faible' },
      { wilaya: 'El Oued (Guemar / Reguiba)', currentAvailableEstimate: 95, forecastNext3Months: 280, mainWasteType: 'Palmes de taille & Dattes', logisticalRisk: 'Faible' },
      { wilaya: 'Ouargla (Hassi Messaoud)', currentAvailableEstimate: 60, forecastNext3Months: 180, mainWasteType: 'Fibres et palmes', logisticalRisk: 'Moyen' },
      { wilaya: 'Ghardaïa (Metlili)', currentAvailableEstimate: 45, forecastNext3Months: 110, mainWasteType: 'Mélange oasien', logisticalRisk: 'Moyen' },
      { wilaya: 'Adrar (Timimoun)', currentAvailableEstimate: 80, forecastNext3Months: 240, mainWasteType: 'Dattes de faible valeur (Tegaza)', logisticalRisk: 'Élevé' },
    ];
  }

  /**
   * Évalue le risque de qualité d'un lot de production avant ou après fabrication
   */
  static predictQualityRisk(batchId: string, compositionStr: string, averageMoistureInput: number): QualityRiskPrediction {
    let riskScore = 15; // de base
    const potentialFailures: string[] = [];
    const recommendedActions: string[] = [];

    // Facteur d'humidité
    if (averageMoistureInput > 14) {
      riskScore += 45;
      potentialFailures.push("Risque élevé de développement de moisissures (Mycotoxines) pendant le stockage.");
      recommendedActions.push("Procéder à un séchage solaire ou thermique complémentaire pour descendre sous la barre des 12% d'humidité.");
    } else if (averageMoistureInput > 12) {
      riskScore += 20;
      potentialFailures.push("Risque modéré d'altération de la conservation à moyen terme (supérieur à 3 mois).");
      recommendedActions.push("Ventiler le lot de production et stocker dans des sacs respirants dans un endroit sec.");
    }

    // Facteurs de composition
    if (compositionStr.toLowerCase().includes('palme') && !compositionStr.toLowerCase().includes('noyau')) {
      riskScore += 15;
      potentialFailures.push("Carence protéique et énergétique possible due à un ratio trop élevé de palmes sèches.");
      recommendedActions.push("Complémenter la formulation avec 10% de tourteau de soja ou d'azote oasien enrichi.");
    }

    if (compositionStr.toLowerCase().includes('datte') && averageMoistureInput > 13) {
      riskScore += 20;
      potentialFailures.push("Colmatage du broyeur et fermentation rapide induite par les sucres libres de la datte.");
      recommendedActions.push("Mélanger les dattes collantes avec des supports secs comme le broyat de palmes avant le passage au broyeur.");
    }

    // Décision finale
    let predictedCompliance: 'Conforme' | 'Non Conforme' | 'À Risque' = 'Conforme';
    if (riskScore > 50) {
      predictedCompliance = 'Non Conforme';
    } else if (riskScore > 25) {
      predictedCompliance = 'À Risque';
    }

    if (riskScore <= 25) {
      recommendedActions.push("Paramètres optimaux. Procéder à l'ensachage standard sous label 'GourFeed Qualité'.");
    }

    return {
      batchId,
      riskScore,
      potentialFailures,
      recommendedActions,
      predictedCompliance
    };
  }
}
