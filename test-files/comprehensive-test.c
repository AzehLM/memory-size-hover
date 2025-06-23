#include <stdio.h>
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>

// Test basique des types fondamentaux
int main() {
    // Types caractères
    char c1;                    // 1 byte
    signed char c2;             // 1 byte
    unsigned char c3;           // 1 byte

    // Types entiers courts
    short s1;                   // 2 bytes
    short int s2;               // 2 bytes
    unsigned short s3;          // 2 bytes
    unsigned short int s4;      // 2 bytes

    // Types entiers standards
    int i1;                     // 4 bytes
    signed i2;                  // 4 bytes
    signed int i3;              // 4 bytes
    unsigned i4;                // 4 bytes
    unsigned int i5;            // 4 bytes

    // Types entiers longs (dépend de l'architecture)
    long l1;                    // 4/8 bytes
    long int l2;                // 4/8 bytes
    signed long l3;             // 4/8 bytes
    signed long int l4;         // 4/8 bytes
    unsigned long l5;           // 4/8 bytes
    unsigned long int l6;       // 4/8 bytes

    // Types entiers très longs
    long long ll1;              // 8 bytes
    long long int ll2;          // 8 bytes
    signed long long ll3;       // 8 bytes
    signed long long int ll4;   // 8 bytes
    unsigned long long ll5;     // 8 bytes
    unsigned long long int ll6; // 8 bytes

    // Types flottants
    float f1;                   // 4 bytes
    double d1;                  // 8 bytes
    long double ld1;            // 12/16 bytes

    // Types booléens
    bool b1;                    // 1 byte (C++)
    _Bool b2;                   // 1 byte (C99)

    // Caractères larges
    wchar_t wc1;                // 2/4 bytes

    // Pointeurs
    void* ptr1;                 // 4/8 bytes
    char* ptr2;                 // 4/8 bytes
    int* ptr3;                  // 4/8 bytes
    float* ptr4;                // 4/8 bytes
    double* ptr5;               // 4/8 bytes
    void** ptr6;                // 4/8 bytes

    // Types système
    size_t sz1;                 // 4/8 bytes
    ptrdiff_t pd1;              // 4/8 bytes

    // Types de taille fixe
    int8_t i8;                  // 1 byte
    uint8_t ui8;                // 1 byte
    int16_t i16;                // 2 bytes
    uint16_t ui16;              // 2 bytes
    int32_t i32;                // 4 bytes
    uint32_t ui32;              // 4 bytes
    int64_t i64;                // 8 bytes
    uint64_t ui64;              // 8 bytes

    // Types rapides
    int_fast8_t if8;            // varies
    uint_fast8_t uif8;          // varies
    int_fast16_t if16;          // varies
    uint_fast16_t uif16;        // varies
    int_fast32_t if32;          // varies
    uint_fast32_t uif32;        // varies
    int_fast64_t if64;          // varies
    uint_fast64_t uif64;        // varies

    // Types minimum
    int_least8_t il8;           // varies
    uint_least8_t uil8;         // varies
    int_least16_t il16;         // varies
    uint_least16_t uil16;       // varies
    int_least32_t il32;         // varies
    uint_least32_t uil32;       // varies
    int_least64_t il64;         // varies
    uint_least64_t uil64;       // varies

    // Types maximum
    intmax_t imax;              // 8 bytes
    uintmax_t uimax;            // 8 bytes

    return 0;
}
