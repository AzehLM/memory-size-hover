# Memory Size Hover

Extension VSCode qui affiche la taille mémoire des types de variables C/C++ au survol.

![Demo](https://via.placeholder.com/600x300/007ACC/FFFFFF?text=Demo+Screenshot)

## Fonctionnalités

- 🔍 Affichage instantané de la taille mémoire au survol des types
- 🏗️ Support des architectures 32-bit et 64-bit automatique
- 🔧 Compatible avec C et C++
- 📊 Types supportés : int, float, double, char, pointeurs, typedefs, structs, classes, unions
- ✨ Reconnaissance intelligente des types composés (ex: "long long int", "unsigned long")
- 🎯 **Analyse des classes C++** : Support de l'héritage et des tables virtuelles
- 📐 **Visualisation du padding** : Affichage du padding et du memory layout des structures


## Installation

### Depuis le marketplace VSCode
Recherchez "Memory Size Hover" dans l'onglet Extensions de VSCode et installez-la.

### Installation manuelle
1. Téléchargez le fichier `.vsix` depuis les [releases GitHub](https://github.com/AzehLM/memory-size-hover/releases)
2. Dans VSCode : `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
3. Sélectionnez le fichier téléchargé

## Utilisation

1. Ouvrez un fichier `.c`, `.cpp`, `.h` ou `.hpp`
2. Survolez n'importe quel type de variable
3. Une info-bulle apparaîtra avec la taille mémoire

### Exemple

```c
int main() {
    int number;     // Survol → "Memory Size: 4 bytes"
    float decimal;  // Survol → "Memory Size: 4 bytes"
    char* text;     // Survol → "Memory Size: 8 bytes" (sur 64-bit)
    return 0;
}
```

## Configuration

- `memorySizeHover.showArchitecture` : Afficher l'architecture dans l'info-bulle (défaut: true)

## Types supportés

- Types de base : `char`, `int`, `float`, `double`, etc.
- Modificateurs : `unsigned`, `signed`, `long`, `short`
- Pointeurs : `int*`, `char*`, `void*`, etc.
- Types de taille fixe : `int32_t`, `uint64_t`, etc.
- Types système : `size_t`, `ptrdiff_t`, etc.

## Développement

### Publication automatique

L'extension est automatiquement publiée sur le marketplace VSCode lors de la création d'une release GitHub.

#### Workflow de publication :
1. **Développement local** : Testez avec `F5` en mode debug
2. **Nouvelle version** :
   ```bash
   npm run version:patch  # ou minor/major
   ```
3. **Release GitHub** : Créez une release sur GitHub
4. **Publication automatique** : L'extension sera automatiquement publiée

#### Commandes utiles :
```bash
# Test local
npm run compile
npm run install-local

# Versions
npm run version:patch    # 1.0.0 → 1.0.1
npm run version:minor    # 1.0.0 → 1.1.0
npm run version:major    # 1.0.0 → 2.0.0
```

## Licence

MIT
