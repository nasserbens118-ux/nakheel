# Plateforme Nakheel — Valorisation Circulaire des Déchets de Palmier

> **Slogan** : « Transformer les déchets de palmier en valeur durable »
>
> Plateforme intelligente de gestion logistique, de diagnostic qualité par IA et de traçabilité unitaire par QR Code, visant à transformer les résidus de palmier-dattier en alimentation de bétail locale et hautement nutritive.

---

## 📖 Description du Projet

Dans les oasis algériennes (Biskra, El Oued, Ouargla, Adrar, Ghardaïa), la culture du palmier-dattier génère chaque année des centaines de milliers de tonnes de résidus (palmes sèches, fibres, noyaux, dattes déclassées) qui sont souvent brûlés à l'air libre, provoquant un désastre écologique. Parallèlement, les éleveurs de bétail souffrent de la cherté des aliments importés.

**Nakheel Platform** résout ce problème à travers un modèle d'économie circulaire :
1. **Dépôt des déclarations** de gisements de déchets par les agriculteurs oasiens.
2. **Diagnostic Qualité assisté par IA** mesurant la propreté, la sécheresse et conseillant les traitements.
3. **Optimisation logistique** de collecte et de transport vers les centres de transformation.
4. **Console de fabrication industrielle** pour formuler des aliments ovins et bovins riches et économiques.
5. **Bulletin Qualité Labo & Génération de QR Code** pour assurer une traçabilité totale du sac d'aliment jusqu'à la parcelle d'oasis d'origine.
6. **Tableau de bord intelligent par IA** pour anticiper la demande des éleveurs et optimiser les stocks.

---

## 🛠️ Stack Technique

- **Frontend** : React (TypeScript), CSS Moderne, Icônes Lucide.
- **Routage & Wrapper** : Next.js 16 (App Router catch-all).
- **Données & Stockage** :
  - *Mode Local* : Base de données `NakheelDB` persistée en `localStorage` avec événements de mise à jour synchrones.
  - *Mode Cloud (Supabase)* : Intégration optionnelle via PostgreSQL, RLS (Row Level Security), procédures stockées PL/pgSQL et triggers automatiques.
- **Outils & Lint** : TypeScript, Vite (pour le backup), Next Compiler.

---

## ⚙️ Architecture & Fichiers Clés

- **Fiche d'initialisation SQL** : [init_nakheel.sql](file:///c:/Users/Lina_Computer/Desktop/Nakheel/supabase/migrations/20260614000000_init_nakheel.sql) - Configuration de la base relationnelle, des politiques RLS et des triggers.
- **Données de test initiales** : [seed_nakheel.sql](file:///c:/Users/Lina_Computer/Desktop/Nakheel/supabase/migrations/20260614000001_seed_nakheel.sql) - Utilisateurs de démo, produits et gisements.
- **Moteur de stockage local** : [db.ts](file:///c:/Users/Lina_Computer/Desktop/Nakheel/src/services/db.ts) - Algorithmes d'évaluation de qualité IA et de prédiction de stocks.
- **Provider d'état React** : [NakheelContext.tsx](file:///c:/Users/Lina_Computer/Desktop/Nakheel/src/components/NakheelContext.tsx) - Actions métiers (déclarer, valider, fabriquer, commander, livrer).
- **Centre de Validation** : [TestConsole.tsx](file:///c:/Users/Lina_Computer/Desktop/Nakheel/src/views/TestConsole.tsx) - Console de test avec 12 assertions clés.
- **Console Démo** : Intégrée dans [App.tsx](file:///c:/Users/Lina_Computer/Desktop/Nakheel/src/App.tsx) pour piloter la présentation.

---

## 🔐 Comptes de Démo & Rôles

Basculez instantanément via l'écran de connexion ou l'outil Démo :

1. **Dr. Karim Merabet** (`admin@nakheel.com` / `admin123`) :
   - *Rôle* : Administrateur / Expert Qualité.
   - *Pouvoirs* : Évaluation IA, programmation de collectes, validation finale des lots labo, gestion des commandes.
2. **Tariq Benouad** (`operator@nakheel.com` / `operator123`) :
   - *Rôle* : Opérateur de Centre de Tolga.
   - *Pouvoirs* : Réception des matières premières, création de lots de fabrication, impression QR Code.
3. **Ahmed Belkacem** (`ahmed.biskra@gmail.com` / `ahmed123`) :
   - *Rôle* : Producteur Oasien (Fournisseur).
   - *Pouvoirs* : Déclaration de déchets de palmes avec photos, suivi de sa note de fiabilité.
4. **Yacine Touati** (`yacine.touati@outlook.com` / `yacine123`) :
   - *Rôle* : Éleveur Ovin/Bovin (Client).
   - *Pouvoirs* : Catalogue d'aliments, commandes de sacs, réclamations et scan de QR Code.

---

## 🔄 Le Cycle Circulaire en 12 Étapes (Simulation Démo)

Activez le **Mode Démo** dans l'en-tête pour dérouler ces étapes automatiquement ou manuellement :

1. **Déclaration** : Ahmed déclare 800 kg de palmes sèches à Tolga.
2. **Diagnostic IA** : Calcul automatique d'un score de 78/100 (Recommandation : *à sécher*).
3. **Approbation Admin** : L'administrateur valide le diagnostic IA et alloue un silo de traitement.
4. **Planification** : Fixation d'une date de collecte et génération de l'ordre logistique.
5. **Enlèvement** : Le chauffeur-opérateur charge le gisement oasien.
6. **Réception** : Pesée et déchargement sécurisé au centre de Tolga.
7. **Silo & RMB** : Stockage et création du lot de matière première RMB.
8. **Fabrication** : L'opérateur lance un lot de production de 750 kg d'**Aliment ovins économique**.
9. **Analyses Labo** : Validation chimique (Humidité 11%, fibres 14.8%) et activation du QR Code de traçabilité.
10. **Commande** : Yacine commande 200 kg ; le stock est immédiatement réservé sur le lot labo.
11. **Livraison** : Commande livrée et scan QR de la fiche de traçabilité complète.
12. **Décisions IA** : Actualisation dynamique des métriques d'impact environnemental (CO₂ évité) et prédictions de stocks.

---

## 🧪 Console de Validation (12 Tests Unitaires)

Cliquez sur l'onglet **Centre de Validation** dans l'application pour exécuter la suite de tests automatisés. Elle valide :
- L'intégrité des 4 profils utilisateurs et leurs droits d'accès.
- L'exactitude des calculs de scores physico-chimiques et de décision IA.
- L'incrémentation et la réservation de stock en inventaire lors des cycles d'approbation et d'achat.
- La mise à jour en temps réel des indicateurs financiers, sociaux et écologiques (CO₂ évité).

---

## 🚀 Installation Locale

1. Installez les dépendances :
   ```bash
   npm install
   ```
2. Lancez le serveur de développement local :
   ```bash
   npm run dev
   ```
3. Ouvrez votre navigateur sur [http://localhost:3000](http://localhost:3000).

---

## 🔮 Limitations & Perspectives Future

- **Intégration Balance Connectée** : Pesée automatisée des sacs par capteurs IoT.
- **Application Chauffeur Hors-Ligne** : Suivi GPS des camions oasiens même en zones sahariennes blanches.
- **Multilingue Arabe/Français** : Traduction intégrale pour faciliter l'adoption par tous les agriculteurs.
