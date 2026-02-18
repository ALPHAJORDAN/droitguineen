# Nettoyage des Fichiers Orphelins

## Description

Le système de nettoyage des fichiers permet d'identifier et de supprimer les fichiers PDF orphelins dans le répertoire `uploads/`. Un fichier est considéré comme orphelin s'il existe sur le disque mais n'est pas référencé dans la base de données.

## Utilisation

### Vérifier les fichiers orphelins (dry-run)

```bash
npm run cleanup:dry-run
```

Cette commande affiche les fichiers qui seraient supprimés sans les supprimer réellement.

### Nettoyer les fichiers orphelins

```bash
npm run cleanup
```

Cette commande supprime effectivement les fichiers orphelins identifiés.

## Fonctionnalités

### 1. Détection automatique
- Scanne le répertoire `uploads/`
- Compare avec les références en base de données
- Identifie les fichiers non référencés

### 2. Rapport détaillé
- Nombre de fichiers scannés
- Liste des fichiers orphelins
- Espace disque libéré
- Erreurs éventuelles

### 3. Mode dry-run
- Permet de prévisualiser les suppressions
- Aucune modification du système de fichiers
- Calcul de l'espace qui serait libéré

## Nettoyage automatique

### Lors de la suppression d'un texte

Le fichier PDF est automatiquement supprimé lorsqu'un texte est supprimé via l'API :

```
DELETE /upload/files/:id
```

### En cas d'erreur de traitement

Si le traitement d'un PDF échoue (extraction, parsing, sauvegarde), le fichier est automatiquement nettoyé pour éviter les orphelins.

## Planification (Optionnel)

Pour exécuter le nettoyage automatiquement, vous pouvez utiliser un cron job :

### Linux/Mac (crontab)

```bash
# Tous les jours à 3h du matin
0 3 * * * cd /path/to/backend && npm run cleanup >> /var/log/cleanup.log 2>&1
```

### Windows (Task Scheduler)

Créer une tâche planifiée qui exécute :
```
npm run cleanup
```

## API Programmatique

Vous pouvez également utiliser les fonctions directement dans votre code :

```typescript
import { cleanupOrphanedFiles, findOrphanedFiles } from './lib/file-cleanup';

// Trouver les fichiers orphelins
const orphaned = await findOrphanedFiles();
console.log(`${orphaned.length} fichiers orphelins trouvés`);

// Nettoyer (avec dry-run)
const result = await cleanupOrphanedFiles(undefined, true);
console.log(`Espace libérable: ${result.totalSizeFreed} bytes`);

// Nettoyer (réel)
const result = await cleanupOrphanedFiles();
console.log(`${result.deletedFiles.length} fichiers supprimés`);
```

## Exemple de sortie

```
🧹 Démarrage du nettoyage des fichiers orphelins...

📊 RAPPORT DE NETTOYAGE DES FICHIERS
=====================================

Fichiers scannés: 45
Fichiers orphelins trouvés: 3
Fichiers supprimés: 3
Erreurs: 0
Espace libéré: 12.5 MB

Fichiers orphelins:
  - 1702345678-document.pdf
  - 1702345890-test.pdf
  - 1702346012-sample.pdf

✅ Nettoyage terminé avec succès
```
