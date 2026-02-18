# Corrections d'Extraction des Articles

## Problèmes Corrigés

### 1. **Pattern Regex Amélioré**
- ✅ Gère `Article`, `Art.`, `Art` (avec ou sans point)
- ✅ Supporte chiffres romains (`i`, `ii`, `iii`, etc.)
- ✅ Reconnaît `premier`, `1er`
- ✅ Capture tout le contenu jusqu'au prochain article

### 2. **Normalisation des Numéros**
- `Article i` → Article 1
- `Article premier` → Article 1
- `Article 1er` → Article 1
- Chiffres romains convertis en nombres

### 3. **Nettoyage du Contenu**
- Suppression des caractères `#`
- Normalisation des espaces
- Gestion des sauts de page

## Fichiers Modifiés

1. **ocr-pipeline.ts** (ligne 565-640)
   - Fonction `extractStructure()`
   - Pattern amélioré pour extraction articles

2. **upload.ts** (ligne 320-360)
   - Fonction `extractArticles()`
   - Même pattern pour cohérence

## Prochaines Étapes

### Réintégrer le Code Civil

1. **Supprimer l'ancien** :
   ```sql
   DELETE FROM "Article" WHERE "texteId" = 'id-du-code-civil';
   DELETE FROM "Section" WHERE "texteId" = 'id-du-code-civil';
   DELETE FROM "Texte" WHERE id = 'id-du-code-civil';
   ```

2. **Réuploader le PDF** :
   - Le système utilisera les nouveaux patterns
   - Meilleure extraction garantie

3. **Vérifier** :
   - Articles complets
   - Numérotation correcte
   - Ordre logique

## Améliorations Apportées

| Avant | Après |
|-------|-------|
| Articles tronqués | Articles complets |
| "Article i" non reconnu | Converti en "1" |
| Contenu mélangé | Ordre préservé |
| Sauts de page cassent articles | Gérés correctement |
