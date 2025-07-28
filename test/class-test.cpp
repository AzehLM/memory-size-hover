#include <iostream>
#include <string>

// Simple class without inheritance
class SimpleClass {
private:
    int value;
    double precision;
    char* name;
    
public:
    void setValue(int v) { value = v; }
    int getValue() const { return value; }
};

// Class with inheritance
class BaseClass {
protected:
    int baseValue;
    
public:
    void setBase(int v) { baseValue = v; }
};

class DerivedClass : public BaseClass {
private:
    float derivedValue;
    std::string text;
    
public:
    void setDerived(float v) { derivedValue = v; }
};

// Class with multiple data members
class ComplexClass {
private:
    int integers[5];
    double* dynamicArray;
    char buffer[256];
    bool flags[8];
    
public:
    void process() {}
    int calculate(int x, int y) { return x + y; }
};

int main() {
    SimpleClass simple;
    DerivedClass derived;
    ComplexClass complex;
    
    // These should show size when hovering over class names
    SimpleClass* simplePtr;
    DerivedClass derivedObj;
    ComplexClass complexInstance;
    
    return 0;
}