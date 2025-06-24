# Changelog

## [1.1.0] - 2025-01-24

### Nouvelles fonctionnalités
- 🎯 **Support des classes C++** : Analyse complète des classes avec héritage et méthodes virtuelles
- 📐 **Visualisation du padding** : Affichage détaillé du memory layout avec padding pour toutes les structures et classes
- 🔧 **Support des unions** : Calcul et affichage corrects de la taille des unions
- 🎨 **Interface améliorée** : Différentes couleurs pour struct (vert), class (violet) et union (rouge)

### Améliorations
- Détection améliorée des types complexes
- Meilleure gestion du cache pour les structures
- Support des classes avec héritage multiple (base)
- Affichage des virtual table pointers (vptr)

### Exemple de nouvel affichage
```
Class Shape
Total Size: 16 bytes
✓ Has virtual table
Alignment: 8 bytes

Memory Layout:
00: [vptr      ] 8 bytes (virtual table pointer)
08: [color     ] 4 bytes (int)
12: ░░░░ 4 bytes padding
```

## [1.0.13] - 2025-01-23

### Corrections
- Correction mineure de compatibilité

## [1.0.0] - 2025-01-20

### Version initiale
- Support des types de base C/C++
- Détection automatique de l'architecture (32/64 bits)
- Support des pointeurs et types composés
- Configuration pour afficher/masquer l'architecture
