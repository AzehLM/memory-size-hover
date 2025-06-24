#include <iostream>

// Classe simple sans héritage
class Point {
    int x;
    int y;
};

// Classe avec méthode virtuelle
class Shape {
public:
    virtual void draw() = 0;
    virtual double area() = 0;
protected:
    int color;
};

// Classe dérivée
class Rectangle : public Shape {
public:
    void draw() override {}
    double area() override { return width * height; }
private:
    double width;
    double height;
};

// Classe avec padding
class PaddingExample {
    char c;      // 1 byte + 3 bytes padding
    int i;       // 4 bytes
    char c2;     // 1 byte + 7 bytes padding
    double d;    // 8 bytes
};

// Union example
union Data {
    int i;          // 4 bytes
    float f;        // 4 bytes
    double d;       // 8 bytes
    char str[20];   // 20 bytes
};

// Classe complexe avec héritage multiple
class Base1 {
    virtual void func1() {}
    int data1;
};

class Base2 {
    virtual void func2() {}
    int data2;
};

class Derived : public Base1, public Base2 {
    void func1() override {}
    void func2() override {}
    int data3;
};

// Structure avec classes imbriquées
struct Container {
    class InnerClass {
        int value;
        char flag;
    } inner;

    double amount;
    char status;
};

int main() {
    // Test hover sur ces types
    Point p;
    Shape* s;
    Rectangle r;
    PaddingExample pe;
    Data d;
    Derived derived;
    Container c;

    return 0;
}
