# Not-Venda
Inventory Management System

## Features
- Add products with initial stock
- Restock existing products
- Sell products with stock validation
- Remove products from inventory
- View current inventory quantities

## Usage
```python
from inventory import InventoryManagementSystem

inventory = InventoryManagementSystem()
inventory.add_product("Laptop", 10)
inventory.sell_product("Laptop", 2)
print(inventory.get_stock("Laptop"))  # 8
```

## Run tests
```bash
python -m unittest discover -s tests -p "test_*.py"
```
