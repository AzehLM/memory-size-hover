#ifndef STRUCT_TEST_H
#define STRUCT_TEST_H

#include <stdint.h>

// Structure simple
struct Point {
    int x;
    int y;
};

// Structure avec différents types
struct Person {
    char name[32];
    int age;
    float height;
    double salary;
};

// Structure avec pointeurs
struct Node {
    int data;
    struct Node* next;
    char* description;
};

// Structure avec types de taille fixe
struct Packet {
    uint8_t header;
    uint16_t length;
    uint32_t timestamp;
    uint64_t payload;
};

// Typedef struct
typedef struct {
    float x, y, z;
    int id;
} Vector3D;

// Structure avec alignement complexe
struct Complex {
    char flag;
    double value;
    char another_flag;
    int number;
};

// Structure avec tableaux
struct Matrix {
    float data[4][4];
    int rows;
    int cols;
};

#endif
