#include <iostream>
#include <cstdint>

class TestClass {
private:
    int value;                  // 4 bytes
    double precision;           // 8 bytes
    char* name;                 // 4/8 bytes

public:
    bool isValid() {           // 1 byte
        return true;
    }

    void process(float data) { // 4 bytes
        // Test avec paramètres
    }
};

int main() {
    // Test types C++
    bool flag = true;          // 1 byte
    wchar_t wide = L'A';       // 2/4 bytes

    // Test avec auto (should not trigger hover)
    auto automatic = 42;

    // Test pointeurs complexes
    int** doublePtr;           // 4/8 bytes

    return 0;
}
