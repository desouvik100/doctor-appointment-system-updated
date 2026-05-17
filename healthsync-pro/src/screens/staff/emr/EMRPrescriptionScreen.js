/**
 * EMR Prescription Screen — Full parity with web EPrescribeForm
 * Drug search (local fallback + API), dosage, frequency, drug interaction check
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../context/ThemeContext';
import { typography, spacing, borderRadius } from '../../../theme/typography';
import { searchDrugs, checkDrugInteractions, createPrescription } from '../../../services/api/emrApi';

// ─── Local drug database (fallback when API unavailable) ───────────────────
const DRUG_DATABASE = [
  // Antibiotics
  { name: 'Amoxicillin',           strength: '500mg',   category: 'Antibiotic' },
  { name: 'Amoxicillin-Clavulanate',strength: '625mg',  category: 'Antibiotic' },
  { name: 'Azithromycin',          strength: '250mg',   category: 'Antibiotic' },
  { name: 'Ciprofloxacin',         strength: '500mg',   category: 'Antibiotic' },
  { name: 'Levofloxacin',          strength: '500mg',   category: 'Antibiotic' },
  { name: 'Metronidazole',         strength: '400mg',   category: 'Antibiotic' },
  { name: 'Doxycycline',           strength: '100mg',   category: 'Antibiotic' },
  { name: 'Cefixime',              strength: '200mg',   category: 'Antibiotic' },
  { name: 'Cefpodoxime',           strength: '200mg',   category: 'Antibiotic' },
  { name: 'Ceftriaxone',           strength: '1g',      category: 'Antibiotic' },
  { name: 'Clindamycin',           strength: '300mg',   category: 'Antibiotic' },
  { name: 'Erythromycin',          strength: '500mg',   category: 'Antibiotic' },
  { name: 'Nitrofurantoin',        strength: '100mg',   category: 'Antibiotic' },
  { name: 'Trimethoprim-Sulfamethoxazole', strength: '960mg', category: 'Antibiotic' },
  { name: 'Vancomycin',            strength: '500mg',   category: 'Antibiotic' },
  { name: 'Meropenem',             strength: '1g',      category: 'Antibiotic' },
  // Analgesics / NSAIDs
  { name: 'Paracetamol',           strength: '500mg',   category: 'Analgesic' },
  { name: 'Paracetamol',           strength: '650mg',   category: 'Analgesic' },
  { name: 'Ibuprofen',             strength: '400mg',   category: 'NSAID' },
  { name: 'Ibuprofen',             strength: '600mg',   category: 'NSAID' },
  { name: 'Diclofenac',            strength: '50mg',    category: 'NSAID' },
  { name: 'Diclofenac',            strength: '75mg',    category: 'NSAID' },
  { name: 'Aspirin',               strength: '75mg',    category: 'Antiplatelet' },
  { name: 'Aspirin',               strength: '150mg',   category: 'Antiplatelet' },
  { name: 'Naproxen',              strength: '250mg',   category: 'NSAID' },
  { name: 'Naproxen',              strength: '500mg',   category: 'NSAID' },
  { name: 'Etoricoxib',            strength: '60mg',    category: 'COX-2 Inhibitor' },
  { name: 'Celecoxib',             strength: '200mg',   category: 'COX-2 Inhibitor' },
  { name: 'Tramadol',              strength: '50mg',    category: 'Opioid Analgesic' },
  { name: 'Tramadol',              strength: '100mg',   category: 'Opioid Analgesic' },
  { name: 'Morphine',              strength: '10mg',    category: 'Opioid Analgesic' },
  { name: 'Codeine',               strength: '30mg',    category: 'Opioid Analgesic' },
  // Antidiabetics
  { name: 'Metformin',             strength: '500mg',   category: 'Antidiabetic' },
  { name: 'Metformin',             strength: '1000mg',  category: 'Antidiabetic' },
  { name: 'Glimepiride',           strength: '1mg',     category: 'Antidiabetic' },
  { name: 'Glimepiride',           strength: '2mg',     category: 'Antidiabetic' },
  { name: 'Glipizide',             strength: '5mg',     category: 'Antidiabetic' },
  { name: 'Gliclazide',            strength: '80mg',    category: 'Antidiabetic' },
  { name: 'Sitagliptin',           strength: '100mg',   category: 'Antidiabetic' },
  { name: 'Vildagliptin',          strength: '50mg',    category: 'Antidiabetic' },
  { name: 'Empagliflozin',         strength: '10mg',    category: 'Antidiabetic' },
  { name: 'Dapagliflozin',         strength: '10mg',    category: 'Antidiabetic' },
  { name: 'Insulin Glargine',      strength: '100U/mL', category: 'Antidiabetic' },
  { name: 'Insulin Aspart',        strength: '100U/mL', category: 'Antidiabetic' },
  { name: 'Insulin Regular',       strength: '100U/mL', category: 'Antidiabetic' },
  // Antihypertensives
  { name: 'Amlodipine',            strength: '5mg',     category: 'Antihypertensive' },
  { name: 'Amlodipine',            strength: '10mg',    category: 'Antihypertensive' },
  { name: 'Losartan',              strength: '50mg',    category: 'ARB' },
  { name: 'Losartan',              strength: '100mg',   category: 'ARB' },
  { name: 'Telmisartan',           strength: '40mg',    category: 'ARB' },
  { name: 'Telmisartan',           strength: '80mg',    category: 'ARB' },
  { name: 'Valsartan',             strength: '80mg',    category: 'ARB' },
  { name: 'Olmesartan',            strength: '20mg',    category: 'ARB' },
  { name: 'Enalapril',             strength: '5mg',     category: 'ACE Inhibitor' },
  { name: 'Ramipril',              strength: '5mg',     category: 'ACE Inhibitor' },
  { name: 'Lisinopril',            strength: '10mg',    category: 'ACE Inhibitor' },
  { name: 'Perindopril',           strength: '4mg',     category: 'ACE Inhibitor' },
  { name: 'Metoprolol',            strength: '25mg',    category: 'Beta Blocker' },
  { name: 'Metoprolol',            strength: '50mg',    category: 'Beta Blocker' },
  { name: 'Atenolol',              strength: '50mg',    category: 'Beta Blocker' },
  { name: 'Bisoprolol',            strength: '5mg',     category: 'Beta Blocker' },
  { name: 'Carvedilol',            strength: '6.25mg',  category: 'Beta Blocker' },
  { name: 'Nebivolol',             strength: '5mg',     category: 'Beta Blocker' },
  { name: 'Hydrochlorothiazide',   strength: '12.5mg',  category: 'Diuretic' },
  { name: 'Furosemide',            strength: '40mg',    category: 'Diuretic' },
  { name: 'Spironolactone',        strength: '25mg',    category: 'Diuretic' },
  { name: 'Indapamide',            strength: '1.5mg',   category: 'Diuretic' },
  // Statins / Lipid
  { name: 'Atorvastatin',          strength: '10mg',    category: 'Statin' },
  { name: 'Atorvastatin',          strength: '20mg',    category: 'Statin' },
  { name: 'Atorvastatin',          strength: '40mg',    category: 'Statin' },
  { name: 'Rosuvastatin',          strength: '10mg',    category: 'Statin' },
  { name: 'Rosuvastatin',          strength: '20mg',    category: 'Statin' },
  { name: 'Simvastatin',           strength: '20mg',    category: 'Statin' },
  { name: 'Fenofibrate',           strength: '145mg',   category: 'Fibrate' },
  { name: 'Ezetimibe',             strength: '10mg',    category: 'Lipid Lowering' },
  // Anticoagulants / Antiplatelets
  { name: 'Warfarin',              strength: '5mg',     category: 'Anticoagulant' },
  { name: 'Rivaroxaban',           strength: '20mg',    category: 'Anticoagulant' },
  { name: 'Apixaban',              strength: '5mg',     category: 'Anticoagulant' },
  { name: 'Dabigatran',            strength: '150mg',   category: 'Anticoagulant' },
  { name: 'Heparin',               strength: '5000U',   category: 'Anticoagulant' },
  { name: 'Clopidogrel',           strength: '75mg',    category: 'Antiplatelet' },
  { name: 'Ticagrelor',            strength: '90mg',    category: 'Antiplatelet' },
  // GI / PPI
  { name: 'Omeprazole',            strength: '20mg',    category: 'PPI' },
  { name: 'Omeprazole',            strength: '40mg',    category: 'PPI' },
  { name: 'Pantoprazole',          strength: '40mg',    category: 'PPI' },
  { name: 'Rabeprazole',           strength: '20mg',    category: 'PPI' },
  { name: 'Esomeprazole',          strength: '40mg',    category: 'PPI' },
  { name: 'Ranitidine',            strength: '150mg',   category: 'H2 Blocker' },
  { name: 'Famotidine',            strength: '20mg',    category: 'H2 Blocker' },
  { name: 'Ondansetron',           strength: '4mg',     category: 'Antiemetic' },
  { name: 'Ondansetron',           strength: '8mg',     category: 'Antiemetic' },
  { name: 'Domperidone',           strength: '10mg',    category: 'Antiemetic' },
  { name: 'Metoclopramide',        strength: '10mg',    category: 'Antiemetic' },
  { name: 'Loperamide',            strength: '2mg',     category: 'Antidiarrheal' },
  { name: 'Bisacodyl',             strength: '5mg',     category: 'Laxative' },
  { name: 'Lactulose',             strength: '10g/15mL',category: 'Laxative' },
  // Antihistamines / Respiratory
  { name: 'Cetirizine',            strength: '10mg',    category: 'Antihistamine' },
  { name: 'Loratadine',            strength: '10mg',    category: 'Antihistamine' },
  { name: 'Fexofenadine',          strength: '120mg',   category: 'Antihistamine' },
  { name: 'Levocetirizine',        strength: '5mg',     category: 'Antihistamine' },
  { name: 'Chlorpheniramine',      strength: '4mg',     category: 'Antihistamine' },
  { name: 'Montelukast',           strength: '10mg',    category: 'Antiasthmatic' },
  { name: 'Salbutamol',            strength: '2mg',     category: 'Bronchodilator' },
  { name: 'Salbutamol Inhaler',    strength: '100mcg',  category: 'Bronchodilator' },
  { name: 'Formoterol',            strength: '12mcg',   category: 'Bronchodilator' },
  { name: 'Tiotropium',            strength: '18mcg',   category: 'Bronchodilator' },
  { name: 'Budesonide',            strength: '200mcg',  category: 'Inhaled Steroid' },
  { name: 'Fluticasone',           strength: '250mcg',  category: 'Inhaled Steroid' },
  { name: 'Theophylline',          strength: '200mg',   category: 'Bronchodilator' },
  // Corticosteroids
  { name: 'Prednisolone',          strength: '5mg',     category: 'Corticosteroid' },
  { name: 'Prednisolone',          strength: '10mg',    category: 'Corticosteroid' },
  { name: 'Dexamethasone',         strength: '0.5mg',   category: 'Corticosteroid' },
  { name: 'Methylprednisolone',    strength: '4mg',     category: 'Corticosteroid' },
  { name: 'Hydrocortisone',        strength: '100mg',   category: 'Corticosteroid' },
  // Thyroid
  { name: 'Levothyroxine',         strength: '25mcg',   category: 'Thyroid' },
  { name: 'Levothyroxine',         strength: '50mcg',   category: 'Thyroid' },
  { name: 'Levothyroxine',         strength: '100mcg',  category: 'Thyroid' },
  { name: 'Carbimazole',           strength: '5mg',     category: 'Antithyroid' },
  { name: 'Propylthiouracil',      strength: '50mg',    category: 'Antithyroid' },
  // Neurological / Psychiatric
  { name: 'Alprazolam',            strength: '0.25mg',  category: 'Anxiolytic' },
  { name: 'Alprazolam',            strength: '0.5mg',   category: 'Anxiolytic' },
  { name: 'Clonazepam',            strength: '0.5mg',   category: 'Anxiolytic' },
  { name: 'Diazepam',              strength: '5mg',     category: 'Anxiolytic' },
  { name: 'Lorazepam',             strength: '1mg',     category: 'Anxiolytic' },
  { name: 'Sertraline',            strength: '50mg',    category: 'Antidepressant' },
  { name: 'Escitalopram',          strength: '10mg',    category: 'Antidepressant' },
  { name: 'Fluoxetine',            strength: '20mg',    category: 'Antidepressant' },
  { name: 'Paroxetine',            strength: '20mg',    category: 'Antidepressant' },
  { name: 'Venlafaxine',           strength: '75mg',    category: 'Antidepressant' },
  { name: 'Amitriptyline',         strength: '10mg',    category: 'Antidepressant' },
  { name: 'Mirtazapine',           strength: '15mg',    category: 'Antidepressant' },
  { name: 'Quetiapine',            strength: '25mg',    category: 'Antipsychotic' },
  { name: 'Olanzapine',            strength: '5mg',     category: 'Antipsychotic' },
  { name: 'Risperidone',           strength: '2mg',     category: 'Antipsychotic' },
  { name: 'Haloperidol',           strength: '5mg',     category: 'Antipsychotic' },
  { name: 'Lithium Carbonate',     strength: '300mg',   category: 'Mood Stabilizer' },
  { name: 'Valproate',             strength: '500mg',   category: 'Mood Stabilizer' },
  { name: 'Gabapentin',            strength: '300mg',   category: 'Neuropathic' },
  { name: 'Pregabalin',            strength: '75mg',    category: 'Neuropathic' },
  { name: 'Duloxetine',            strength: '30mg',    category: 'Neuropathic' },
  { name: 'Phenytoin',             strength: '100mg',   category: 'Antiepileptic' },
  { name: 'Carbamazepine',         strength: '200mg',   category: 'Antiepileptic' },
  { name: 'Levetiracetam',         strength: '500mg',   category: 'Antiepileptic' },
  { name: 'Donepezil',             strength: '5mg',     category: 'Dementia' },
  { name: 'Memantine',             strength: '10mg',    category: 'Dementia' },
  // Supplements / Vitamins
  { name: 'Vitamin D3',            strength: '60000IU', category: 'Supplement' },
  { name: 'Vitamin D3',            strength: '1000IU',  category: 'Supplement' },
  { name: 'Vitamin B12',           strength: '500mcg',  category: 'Supplement' },
  { name: 'Folic Acid',            strength: '5mg',     category: 'Supplement' },
  { name: 'Calcium Carbonate',     strength: '500mg',   category: 'Supplement' },
  { name: 'Ferrous Sulphate',      strength: '200mg',   category: 'Supplement' },
  { name: 'Iron Sucrose',          strength: '100mg',   category: 'Supplement' },
  { name: 'Zinc Sulphate',         strength: '20mg',    category: 'Supplement' },
  { name: 'Magnesium Hydroxide',   strength: '400mg',   category: 'Supplement' },
  { name: 'Omega-3 Fatty Acids',   strength: '1000mg',  category: 'Supplement' },
  { name: 'Multivitamin',          strength: '1 tablet',category: 'Supplement' },
  // Antivirals / Antifungals
  { name: 'Acyclovir',             strength: '400mg',   category: 'Antiviral' },
  { name: 'Oseltamivir',           strength: '75mg',    category: 'Antiviral' },
  { name: 'Fluconazole',           strength: '150mg',   category: 'Antifungal' },
  { name: 'Itraconazole',          strength: '100mg',   category: 'Antifungal' },
  { name: 'Clotrimazole',          strength: '1%',      category: 'Antifungal' },
  // Urology / Others
  { name: 'Tamsulosin',            strength: '0.4mg',   category: 'Alpha Blocker' },
  { name: 'Sildenafil',            strength: '50mg',    category: 'PDE5 Inhibitor' },
  { name: 'Finasteride',           strength: '5mg',     category: 'Urology' },
  { name: 'Oxybutynin',            strength: '5mg',     category: 'Urology' },
  { name: 'Allopurinol',           strength: '100mg',   category: 'Gout' },
  { name: 'Colchicine',            strength: '0.5mg',   category: 'Gout' },
  { name: 'Hydroxychloroquine',    strength: '200mg',   category: 'DMARD' },
  { name: 'Methotrexate',          strength: '2.5mg',   category: 'DMARD' },
  { name: 'Sulfasalazine',         strength: '500mg',   category: 'DMARD' },
  { name: 'Leflunomide',           strength: '20mg',    category: 'DMARD' },
];

// Known drug interaction pairs (local fallback — 40+ real-world pairs)
const KNOWN_INTERACTIONS = [
  // Anticoagulant interactions
  { drugs: ['Warfarin', 'Aspirin'],            severity: 'severe',          recommendation: 'Increased bleeding risk. Monitor INR closely and watch for signs of bleeding.' },
  { drugs: ['Warfarin', 'Ibuprofen'],          severity: 'severe',          recommendation: 'NSAIDs increase anticoagulant effect and GI bleeding risk. Avoid combination.' },
  { drugs: ['Warfarin', 'Naproxen'],           severity: 'severe',          recommendation: 'NSAIDs potentiate warfarin. Avoid; use paracetamol if analgesia needed.' },
  { drugs: ['Warfarin', 'Ciprofloxacin'],      severity: 'moderate',        recommendation: 'Ciprofloxacin inhibits warfarin metabolism. Monitor INR; may need dose reduction.' },
  { drugs: ['Warfarin', 'Metronidazole'],      severity: 'severe',          recommendation: 'Metronidazole significantly increases warfarin effect. Reduce warfarin dose by 30–50%.' },
  { drugs: ['Warfarin', 'Fluconazole'],        severity: 'severe',          recommendation: 'Fluconazole inhibits CYP2C9. INR can double. Monitor closely.' },
  { drugs: ['Warfarin', 'Amiodarone'],         severity: 'severe',          recommendation: 'Amiodarone markedly potentiates warfarin. Reduce warfarin dose by 30–50%.' },
  { drugs: ['Rivaroxaban', 'Aspirin'],         severity: 'moderate',        recommendation: 'Increased bleeding risk. Use only if benefit outweighs risk.' },
  { drugs: ['Clopidogrel', 'Omeprazole'],      severity: 'moderate',        recommendation: 'Omeprazole reduces clopidogrel activation. Use pantoprazole instead.' },
  // Serotonin syndrome
  { drugs: ['Sertraline', 'Tramadol'],         severity: 'severe',          recommendation: 'High risk of serotonin syndrome. Avoid combination; use alternative analgesic.' },
  { drugs: ['Fluoxetine', 'Tramadol'],         severity: 'severe',          recommendation: 'Serotonin syndrome risk. Avoid; consider non-opioid analgesic.' },
  { drugs: ['Escitalopram', 'Tramadol'],       severity: 'severe',          recommendation: 'Serotonin syndrome risk. Avoid combination.' },
  { drugs: ['Sertraline', 'Linezolid'],        severity: 'contraindicated', recommendation: 'Contraindicated — high risk of serotonin syndrome and hypertensive crisis.' },
  { drugs: ['Fluoxetine', 'Metoclopramide'],   severity: 'moderate',        recommendation: 'Risk of extrapyramidal effects and serotonin syndrome.' },
  // CNS depression
  { drugs: ['Alprazolam', 'Tramadol'],         severity: 'severe',          recommendation: 'Additive CNS and respiratory depression. Use with extreme caution; reduce doses.' },
  { drugs: ['Diazepam', 'Morphine'],           severity: 'severe',          recommendation: 'Profound CNS and respiratory depression. Avoid unless in monitored setting.' },
  { drugs: ['Clonazepam', 'Codeine'],          severity: 'severe',          recommendation: 'Risk of respiratory depression. Avoid combination.' },
  { drugs: ['Quetiapine', 'Lorazepam'],        severity: 'severe',          recommendation: 'Risk of excessive sedation and respiratory depression.' },
  // Dual RAAS blockade
  { drugs: ['Losartan', 'Enalapril'],          severity: 'contraindicated', recommendation: 'Dual RAAS blockade — contraindicated. Risk of renal failure, hyperkalaemia, hypotension.' },
  { drugs: ['Telmisartan', 'Ramipril'],        severity: 'contraindicated', recommendation: 'Dual RAAS blockade — contraindicated. Avoid combination.' },
  { drugs: ['Losartan', 'Spironolactone'],     severity: 'moderate',        recommendation: 'Risk of hyperkalaemia. Monitor potassium levels regularly.' },
  { drugs: ['Enalapril', 'Spironolactone'],    severity: 'moderate',        recommendation: 'Risk of hyperkalaemia. Monitor potassium and renal function.' },
  // Antidiabetic interactions
  { drugs: ['Metformin', 'Ciprofloxacin'],     severity: 'moderate',        recommendation: 'Ciprofloxacin may alter blood glucose. Monitor glucose closely.' },
  { drugs: ['Glimepiride', 'Fluconazole'],     severity: 'severe',          recommendation: 'Fluconazole inhibits glimepiride metabolism — risk of severe hypoglycaemia.' },
  { drugs: ['Metformin', 'Furosemide'],        severity: 'moderate',        recommendation: 'Furosemide may increase metformin levels. Monitor renal function.' },
  { drugs: ['Insulin Glargine', 'Metoprolol'], severity: 'moderate',        recommendation: 'Beta-blockers mask hypoglycaemia symptoms. Monitor glucose carefully.' },
  // Statin interactions
  { drugs: ['Atorvastatin', 'Clarithromycin'], severity: 'severe',          recommendation: 'Clarithromycin inhibits CYP3A4 — risk of myopathy/rhabdomyolysis. Avoid.' },
  { drugs: ['Simvastatin', 'Amlodipine'],      severity: 'moderate',        recommendation: 'Amlodipine increases simvastatin levels. Limit simvastatin to 20mg.' },
  { drugs: ['Rosuvastatin', 'Fenofibrate'],    severity: 'moderate',        recommendation: 'Increased risk of myopathy. Monitor CK levels.' },
  // Antihypertensive interactions
  { drugs: ['Metoprolol', 'Amlodipine'],       severity: 'minor',           recommendation: 'Additive hypotensive effect. Monitor blood pressure; may be used intentionally.' },
  { drugs: ['Atenolol', 'Verapamil'],          severity: 'contraindicated', recommendation: 'Risk of complete heart block and cardiac arrest. Contraindicated.' },
  { drugs: ['Bisoprolol', 'Diltiazem'],        severity: 'severe',          recommendation: 'Risk of bradycardia and AV block. Avoid combination.' },
  { drugs: ['Amlodipine', 'Simvastatin'],      severity: 'moderate',        recommendation: 'Amlodipine increases simvastatin exposure. Cap simvastatin at 20mg.' },
  // GI interactions
  { drugs: ['Prednisolone', 'Ibuprofen'],      severity: 'moderate',        recommendation: 'Increased GI bleeding risk. Add PPI gastroprotection.' },
  { drugs: ['Prednisolone', 'Aspirin'],        severity: 'moderate',        recommendation: 'Increased GI ulceration risk. Use PPI cover.' },
  { drugs: ['Dexamethasone', 'Diclofenac'],    severity: 'moderate',        recommendation: 'Increased GI bleeding risk. Avoid or add PPI.' },
  // Antibiotic interactions
  { drugs: ['Ciprofloxacin', 'Theophylline'],  severity: 'severe',          recommendation: 'Ciprofloxacin inhibits theophylline metabolism — risk of toxicity. Reduce theophylline dose.' },
  { drugs: ['Metronidazole', 'Alcohol'],       severity: 'severe',          recommendation: 'Disulfiram-like reaction — severe nausea, vomiting, flushing. Avoid alcohol during and 48h after.' },
  { drugs: ['Doxycycline', 'Calcium Carbonate'],severity: 'moderate',       recommendation: 'Calcium chelates doxycycline, reducing absorption. Take 2 hours apart.' },
  { drugs: ['Ciprofloxacin', 'Calcium Carbonate'],severity: 'moderate',     recommendation: 'Calcium reduces ciprofloxacin absorption. Take 2 hours apart.' },
  // Psychiatric interactions
  { drugs: ['Lithium Carbonate', 'Ibuprofen'], severity: 'severe',          recommendation: 'NSAIDs reduce lithium excretion — risk of lithium toxicity. Monitor lithium levels.' },
  { drugs: ['Lithium Carbonate', 'Losartan'],  severity: 'severe',          recommendation: 'ARBs reduce lithium clearance — risk of toxicity. Monitor closely.' },
  { drugs: ['Carbamazepine', 'Erythromycin'],  severity: 'severe',          recommendation: 'Erythromycin inhibits carbamazepine metabolism — risk of toxicity.' },
  { drugs: ['Valproate', 'Aspirin'],           severity: 'moderate',        recommendation: 'Aspirin displaces valproate from protein binding — increased free valproate.' },
  // Thyroid
  { drugs: ['Levothyroxine', 'Calcium Carbonate'],severity: 'moderate',     recommendation: 'Calcium reduces levothyroxine absorption. Take 4 hours apart.' },
  { drugs: ['Levothyroxine', 'Ferrous Sulphate'],severity: 'moderate',      recommendation: 'Iron reduces levothyroxine absorption. Take 4 hours apart.' },
];

const checkLocalInteractions = (drugNames) => {
  const normalized = drugNames.map(d => d.trim().toLowerCase());
  const found = [];
  KNOWN_INTERACTIONS.forEach(pair => {
    const [d1, d2] = pair.drugs.map(d => d.toLowerCase());
    if (normalized.some(n => n.includes(d1)) && normalized.some(n => n.includes(d2))) {
      found.push({ drug1: pair.drugs[0], drug2: pair.drugs[1], severity: pair.severity, recommendation: pair.recommendation });
    }
  });
  return found;
};

const searchLocalDrugs = (query) => {
  const q = query.toLowerCase();
  return DRUG_DATABASE.filter(d => d.name.toLowerCase().includes(q)).slice(0, 8);
};

const FREQUENCIES = [
  { code: 'OD',  label: 'OD',  desc: 'Once daily' },
  { code: 'BD',  label: 'BD',  desc: 'Twice daily' },
  { code: 'TDS', label: 'TDS', desc: 'Three times' },
  { code: 'QID', label: 'QID', desc: 'Four times' },
  { code: 'SOS', label: 'SOS', desc: 'As needed' },
  { code: 'HS',  label: 'HS',  desc: 'At bedtime' },
  { code: 'AC',  label: 'AC',  desc: 'Before meals' },
  { code: 'PC',  label: 'PC',  desc: 'After meals' },
];

const DURATIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '3 months'];

const emptyMed = () => ({
  id: Date.now() + Math.random(),
  drugName: '', strength: '', dosage: '1 tablet',
  frequency: 'BD', duration: '7 days', instructions: '',
});

const DrugSearchInput = ({ value, onChange, onSelect, colors }) => {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  const handleChange = (text) => {
    onChange(text);
    clearTimeout(timer.current);
    if (text.length < 2) { setResults([]); return; }

    // Show local results immediately (O(n) filter)
    const localResults = searchLocalDrugs(text);
    setResults(localResults);

    // Then try API — replace if successful
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchDrugs(text);
        const apiResults = data.drugs || data.results || [];
        if (apiResults.length > 0) setResults(apiResults);
      } catch { /* keep local results */ }
      finally { setSearching(false); }
    }, 500);
  };

  return (
    <View>
      <View style={[styles.drugSearchRow, { borderColor: colors.surfaceBorder, backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.drugInput, { color: colors.textPrimary }]}
          value={value} onChangeText={handleChange}
          placeholder="Search drug name..." placeholderTextColor={colors.textMuted}
        />
        {searching && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />}
      </View>
      {results.length > 0 && (
        <View style={[styles.drugDropdown, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {results.slice(0, 6).map((drug, i) => (
            <TouchableOpacity key={i} style={styles.drugOption}
              onPress={() => {
                onSelect(drug.name || drug);
                setResults([]);
              }}>
              <Text style={[styles.drugOptionText, { color: colors.textPrimary }]}>{drug.name || drug}</Text>
              {(drug.strength || drug.category) && (
                <Text style={[styles.drugOptionSub, { color: colors.textMuted }]}>
                  {[drug.strength, drug.category].filter(Boolean).join(' · ')}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const EMRPrescriptionScreen = ({ navigation, route }) => {
  const { visitId, patientId, patientName, clinicId } = route.params || {};
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [meds, setMeds] = useState([emptyMed()]);
  const [interactions, setInteractions] = useState([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateMed = useCallback((id, field, val) =>
    setMeds(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m)), []);

  const removeMed = useCallback((id) => {
    setMeds(prev => prev.length > 1 ? prev.filter(m => m.id !== id) : prev);
  }, []);

  const handleInteractionCheck = useCallback(async () => {
    const drugNames = meds.filter(m => m.drugName.trim()).map(m => m.drugName);
    if (drugNames.length < 2) {
      Alert.alert('Info', 'Add at least 2 drugs to check interactions.');
      return;
    }
    setCheckingInteractions(true);
    try {
      // Try API first, fall back to local
      let found = [];
      try {
        const data = await checkDrugInteractions(drugNames);
        found = data.interactions || [];
      } catch {
        found = checkLocalInteractions(drugNames);
      }
      setInteractions(found);
      if (!found.length) Alert.alert('✅ Safe', 'No known drug interactions detected.');
    } finally {
      setCheckingInteractions(false);
    }
  }, [meds]);

  const handleSave = async () => {
    const validMeds = meds.filter(m => m.drugName.trim());
    if (!validMeds.length) {
      Alert.alert('Error', 'Add at least one medication.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        clinicId,
        medications: validMeds.map(m => ({
          name: m.drugName, strength: m.strength,
          dosage: m.dosage, frequency: m.frequency,
          duration: m.duration, instructions: m.instructions,
        })),
      };
      // visitId and patientId are optional
      if (visitId) payload.visitId = visitId;
      if (patientId) payload.patientId = patientId;

      await createPrescription(payload);
      Alert.alert('Saved', 'Prescription created successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  const severityColor = {
    contraindicated: '#DC2626', severe: '#EA580C',
    moderate: '#CA8A04', minor: '#2563EB',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#059669', '#047857']} style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>E-Prescribe</Text>
          {patientName && <Text style={styles.headerSub}>{patientName}</Text>}
        </View>
        <TouchableOpacity onPress={() => setMeds(p => [...p, emptyMed()])} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {meds.map((med, idx) => (
          <View key={med.id} style={[styles.medCard, { backgroundColor: colors.surface }]}>
            <View style={styles.medCardHeader}>
              <Text style={[styles.medNum, { color: colors.primary }]}>💊 Medication #{idx + 1}</Text>
              {meds.length > 1 && (
                <TouchableOpacity onPress={() => removeMed(med.id)}>
                  <Text style={styles.removeBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Drug Name *</Text>
            <DrugSearchInput
              value={med.drugName}
              onChange={v => updateMed(med.id, 'drugName', v)}
              onSelect={v => updateMed(med.id, 'drugName', v)}
              colors={colors}
            />

            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Strength</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.surfaceBorder, backgroundColor: colors.background }]}
                  value={med.strength} onChangeText={v => updateMed(med.id, 'strength', v)}
                  placeholder="e.g. 500mg" placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Dosage</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.surfaceBorder, backgroundColor: colors.background }]}
                  value={med.dosage} onChangeText={v => updateMed(med.id, 'dosage', v)}
                  placeholder="e.g. 1 tablet" placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Frequency</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.freqScroll}>
              {FREQUENCIES.map(f => (
                <TouchableOpacity key={f.code} onPress={() => updateMed(med.id, 'frequency', f.code)}
                  style={[styles.freqBtn, med.frequency === f.code && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.freqCode, { color: med.frequency === f.code ? '#fff' : colors.textPrimary }]}>{f.label}</Text>
                  <Text style={[styles.freqDesc, { color: med.frequency === f.code ? 'rgba(255,255,255,0.8)' : colors.textMuted }]}>{f.desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Duration</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.freqScroll}>
              {DURATIONS.map(d => (
                <TouchableOpacity key={d} onPress={() => updateMed(med.id, 'duration', d)}
                  style={[styles.durationBtn, med.duration === d && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.durationText, { color: med.duration === d ? '#fff' : colors.textPrimary }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Instructions</Text>
            <TextInput
              style={[styles.textArea, { color: colors.textPrimary, borderColor: colors.surfaceBorder, backgroundColor: colors.background }]}
              value={med.instructions} onChangeText={v => updateMed(med.id, 'instructions', v)}
              placeholder="e.g. Take after meals with water..." placeholderTextColor={colors.textMuted}
              multiline numberOfLines={2}
            />
          </View>
        ))}

        <TouchableOpacity onPress={handleInteractionCheck} disabled={checkingInteractions}
          style={[styles.interactionBtn, { borderColor: '#F59E0B' }]}>
          {checkingInteractions
            ? <ActivityIndicator color="#F59E0B" />
            : <Text style={styles.interactionBtnText}>🔍 Check Drug Interactions</Text>}
        </TouchableOpacity>

        {interactions.length > 0 && (
          <View style={[styles.interactionPanel, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.interactionTitle}>⚠️ {interactions.length} Interaction(s) Found</Text>
            {interactions.map((item, idx) => (
              <View key={idx} style={[styles.interactionItem, { borderLeftColor: severityColor[item.severity] || '#F59E0B' }]}>
                <Text style={styles.interactionDrugs}>{item.drug1} ↔ {item.drug2}</Text>
                <Text style={[styles.interactionSeverity, { color: severityColor[item.severity] || '#F59E0B' }]}>
                  {item.severity?.toUpperCase()}
                </Text>
                {item.recommendation && <Text style={styles.interactionRec}>{item.recommendation}</Text>}
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          <LinearGradient colors={saving ? ['#9CA3AF', '#6B7280'] : ['#059669', '#047857']} style={styles.saveBtn}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>💾 Save Prescription</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 20 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', ...typography.headlineSmall, fontWeight: '700' },
  headerSub: { color: 'rgba(255,255,255,0.8)', ...typography.labelSmall },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  addBtnText: { color: '#fff', ...typography.labelMedium, fontWeight: '700' },
  scroll: { padding: spacing.xl, paddingBottom: 100 },
  medCard: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  medCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  medNum: { ...typography.bodyMedium, fontWeight: '700' },
  removeBtn: { color: '#EF4444', fontSize: 18, fontWeight: '700' },
  fieldLabel: { ...typography.labelSmall, marginBottom: spacing.xs, marginTop: spacing.sm },
  drugSearchRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: borderRadius.md },
  drugInput: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium },
  drugDropdown: { borderWidth: 1, borderRadius: borderRadius.md, marginTop: spacing.xs, overflow: 'hidden' },
  drugOption: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  drugOptionText: { ...typography.bodyMedium },
  drugOptionSub: { ...typography.labelSmall, marginTop: 2 },
  row: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },
  input: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium },
  freqScroll: { marginBottom: spacing.sm },
  freqBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, marginRight: spacing.sm, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', minWidth: 60 },
  freqCode: { ...typography.labelMedium, fontWeight: '700' },
  freqDesc: { ...typography.labelSmall },
  durationBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginRight: spacing.sm, backgroundColor: 'rgba(0,0,0,0.05)' },
  durationText: { ...typography.labelMedium },
  textArea: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.bodyMedium, minHeight: 60, textAlignVertical: 'top' },
  interactionBtn: { borderWidth: 2, borderRadius: borderRadius.xl, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  interactionBtnText: { color: '#F59E0B', ...typography.bodyMedium, fontWeight: '700' },
  interactionPanel: { borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  interactionTitle: { ...typography.bodyMedium, fontWeight: '700', color: '#92400E', marginBottom: spacing.md },
  interactionItem: { borderLeftWidth: 4, paddingLeft: spacing.md, marginBottom: spacing.sm },
  interactionDrugs: { ...typography.bodyMedium, fontWeight: '600', color: '#1F2937' },
  interactionSeverity: { ...typography.labelSmall, fontWeight: '700' },
  interactionRec: { ...typography.labelSmall, color: '#374151', marginTop: spacing.xs },
  saveBtn: { padding: spacing.lg, borderRadius: borderRadius.xl, alignItems: 'center', marginBottom: spacing.xl },
  saveBtnText: { color: '#fff', ...typography.bodyLarge, fontWeight: '700' },
});

export default EMRPrescriptionScreen;
