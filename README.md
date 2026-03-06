# Memory Size Hover

VSCode extension that displays the memory size of C/C++ variable types on hover.

![Demo](https://via.placeholder.com/600x300/007ACC/FFFFFF?text=Demo+Screenshot)

## Features
- 🔍 Instant memory size display when hovering over types
- 🏗️ Automatic 32-bit and 64-bit architecture support
- 🔧 Compatible with C and C++
- 📊 Supported types: int, float, double, char, pointers, typedefs, etc.
- ✨ Intelligent recognition of compound types (e.g., "long long int", "unsigned long")
- ⚙️ Flexible architecture configuration (auto-detect, target-based, or manual selection)

## Installation instruction

### From the VSCode marketplace
Search for `memory-size-hover` in the Extensions tab and install it

### Manual installation

1. Download the `.vsix` file from the [github releases](https://github.com/AzehLM/memory-size-hover/releases)
2. In VSCode: `ctrl+shift+p` → "Extensions: Install from VSIX..."
3. Select the downloaded file

## Usage

1. Open a `.c`, `.cpp`, `.h` or `.hpp` file
2. Hover any data type
3. A tooltip with the memory size will show

### Example

```c
int main() {
    int number;     // Hover → "Memory Size: 4 bytes"
    float decimal;  // Hover → "Memory Size: 4 bytes"
    char* text;     // Hover → "Memory Size: 8 bytes" (on 64-bit)
    return 0;
}
```

## Configuration

- `memorySizeHover.showArchitecture`: Display architecture in tooltip (default: true)
- `memorySizeHover.architectureMode`: Select architecture detection mode (default: "auto")
  - auto: Automatically detects system architecture (original functionality)
  - target: Attempts to read architecture from project configuration files
  - x32: Forces 32-bit architecture mode
  - x64: Forces 64-bit architecture mode

## Supported types

- Basic data types: `char`, `int`, `float`, `double`, etc.
- Modifiers: `unsigned`, `signed`, `long`, `short`
- Pointers: `int*`, `char*`, `void*`, etc.
- Fixed size types: `int32_t`, `uint64_t`, etc.
- System types: `size_t`, `ptrdiff_t`, etc.

## Development

### Automatic release

The extension is automaticaly published on the VSCode marketplace when there is a new GitHub release.

#### Publication workflow :

1. **Local development** : test with the `F5` VSCode debug mode
2. **New version** : `npm run version:patch`  # or minor/major
3. **GitHub Release** : Create a release on GitHub
4. **Automatic Publishing** : The extension will be automatically published

#### Useful Commands:
```bash
# Local testing
npm run compile
npm run install-local

# Versioning
npm run version:patch    # 1.0.0 → 1.0.1
npm run version:minor    # 1.0.0 → 1.1.0
npm run version:major    # 1.0.0 → 2.0.0
```

## Licence

MIT
