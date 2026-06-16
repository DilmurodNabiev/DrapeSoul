from decimal import Decimal
from typing import Union


def format_price(amount: Union[Decimal, float, int, str]) -> str:
    if isinstance(amount, Decimal):
        value = int(amount.to_integral_value())
    elif isinstance(amount, str):
        value = int(round(float(amount)))
    else:
        value = int(round(float(amount)))
    formatted = f"{value:,}".replace(",", " ")
    return f"{formatted} so'm"
