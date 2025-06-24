#include <stdio.h>
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#include "struct-test.h"

// Structure avec padding complexe
struct PaddingDemo {
    char a;      // 1 byte + 3 padding
    int b;       // 4 bytes
    char c;      // 1 byte + 1 padding
    short d;     // 2 bytes
    char e;      // 1 byte + 7 padding
    double f;    // 8 bytes
}; // Total: 24 bytes

// Union test
union TestUnion {
    char c;
    int i;
    double d;
    float arr[3];
}; // Size: max(1, 4, 8, 12) = 12 bytes

// Test basique des types fondamentaux
int main() {

    struct PaddingDemo pd;
    union TestUnion tu;
    Vector3D vec = {1.0f, 2.0f, 3.0f, 42};

    char c1;
    signed char c2;
    unsigned char c3;

    short s1;
    short int s2;
    unsigned short s3;
    unsigned short int s4;

    int i1;
    signed i2;
    signed int i3;
    unsigned i4;
    unsigned int i5;

    long l1;
    long int l2;
    signed long l3;
    signed long int l4;
    unsigned long l5;
    unsigned long int l6;

    long long ll1;
    long long int ll2;
    signed long long ll3;
    signed long long int ll4;
    unsigned long long ll5;
    unsigned long long int ll6;

    float f1;
    double d1;
    long double ld1;

    bool b1;
    _Bool b2;

    wchar_t wc1;

    void* ptr1;
    char* ptr2;
    int* ptr3;
    float* ptr4;
    double* ptr5;
    void** ptr6;

    size_t sz1;
    ptrdiff_t pd1;

    int8_t i8;
    uint8_t ui8;
    int16_t i16;
    uint16_t ui16;
    int32_t i32;
    uint32_t ui32;
    int64_t i64;
    uint64_t ui64;

    int_fast8_t if8;
    uint_fast8_t uif8;
    int_fast16_t if16;
    uint_fast16_t uif16;
    int_fast32_t if32;
    uint_fast32_t uif32;
    int_fast64_t if64;
    uint_fast64_t uif64;

    int_least8_t il8;
    uint_least8_t uil8;
    int_least16_t il16;
    uint_least16_t uil16;
    int_least32_t il32;
    uint_least32_t uil32;
    int_least64_t il64;
    uint_least64_t uil64;

    intmax_t imax;
    uintmax_t uimax;

    return 0;
}
