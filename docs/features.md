# Memory Size Hover - Documentation des Fonctionnalités

## Support des Classes C++

L'extension analyse maintenant les classes C++ et calcule leur taille totale incluant :

### 1. Tables Virtuelles (vptr)
Quand une classe contient des méthodes virtuelles, un pointeur vers la table virtuelle est ajouté :

```cpp
class Animal {
    virtual void speak() = 0;  // Ajoute un vptr
    int age;
};
// Taille : 16 bytes (8 bytes vptr + 4 bytes int + 4 padding)
```

### 2. Héritage
L'extension détecte l'héritage simple et inclut la taille de la classe de base :

```cpp
class Shape {
    virtual void draw() = 0;
    int color;
};

class Circle : public Shape {
    double radius;
};
// Circle : 24 bytes (16 de Shape + 8 de radius)
```

### 3. Unions
Les unions affichent la taille du plus grand membre :

```cpp
union Data {
    int i;          // 4 bytes
    double d;       // 8 bytes
    char str[20];   // 20 bytes
};
// Union size: 20 bytes
```

## Visualisation du Padding

L'extension affiche maintenant une visualisation détaillée du memory layout :

### Format d'affichage
```
Offset: [nom_membre] taille (type)
Offset: ░░░░ padding
```

### Exemple complet
```cpp
struct Example {
    char flag;      // 1 byte
    int value;      // 4 bytes
    char status;    // 1 byte
    double amount;  // 8 bytes
};
```

Affichage hover :
```
Struct Example
Total Size: 24 bytes
Alignment: 8 bytes

Memory Layout:
00: [flag      ] 1 byte (char)
01: ░░░░░░ 3 bytes padding
04: [value     ] 4 bytes (int)
08: [status    ] 1 byte (char)
09: ░░░░░░░░░░░░░░ 7 bytes padding
16: [amount    ] 8 bytes (double)
```

## Règles d'Alignement

L'extension suit les règles d'alignement standard C/C++ :

1. **char** : alignement 1 byte
2. **short** : alignement 2 bytes
3. **int/float** : alignement 4 bytes
4. **double/pointeurs** : alignement 8 bytes (64-bit)
5. **structures** : alignement = alignement du plus grand membre

## Code Couleur

- 🟩 **Vert** : Structures (struct)
- 🟪 **Violet** : Classes (class)
- 🔴 **Rouge** : Unions (union)
- 🔵 **Bleu** : Types de base

## Limitations Actuelles

1. **Héritage multiple** : Support basique seulement
2. **Templates** : Non supportés (prévu dans une future version)
3. **Bit fields** : Calcul simplifié
4. **Pragma pack** : Non détecté automatiquement

## Utilisation Avancée

### Optimisation du padding
En réorganisant les membres par taille décroissante, vous pouvez réduire le padding :

```cpp
// Non optimisé : 24 bytes
struct Bad {
    char a;     // 1 + 3 padding
    int b;      // 4
    char c;     // 1 + 7 padding
    double d;   // 8
};

// Optimisé : 16 bytes
struct Good {
    double d;   // 8
    int b;      // 4
    char a;     // 1
    char c;     // 1 + 2 padding
};
```

### Détection des problèmes
L'extension aide à identifier :
- Padding excessif
- Mauvais alignement pour le cache
- Structures trop grandes pour une ligne de cache (64 bytes)
