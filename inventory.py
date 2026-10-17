from dataclasses import dataclass


@dataclass
class Product:
    name: str
    quantity: int = 0


class InventoryManagementSystem:
    def __init__(self) -> None:
        self._inventory: dict[str, Product] = {}

    def add_product(self, name: str, quantity: int = 0) -> None:
        self._validate_quantity(quantity)
        if name in self._inventory:
            raise ValueError(f"Product '{name}' already exists.")
        self._inventory[name] = Product(name=name, quantity=quantity)

    def remove_product(self, name: str) -> None:
        self._require_product(name)
        del self._inventory[name]

    def restock_product(self, name: str, quantity: int) -> None:
        self._validate_quantity(quantity)
        product = self._require_product(name)
        product.quantity += quantity

    def sell_product(self, name: str, quantity: int) -> None:
        self._validate_quantity(quantity)
        product = self._require_product(name)
        if product.quantity < quantity:
            raise ValueError(
                f"Insufficient stock for '{name}'. Available: {product.quantity}, requested: {quantity}."
            )
        product.quantity -= quantity

    def get_stock(self, name: str) -> int:
        return self._require_product(name).quantity

    def list_inventory(self) -> dict[str, int]:
        return {name: product.quantity for name, product in self._inventory.items()}

    def _require_product(self, name: str) -> Product:
        if name not in self._inventory:
            raise KeyError(f"Product '{name}' does not exist.")
        return self._inventory[name]

    @staticmethod
    def _validate_quantity(quantity: int) -> None:
        if quantity < 0:
            raise ValueError("Quantity cannot be negative.")
