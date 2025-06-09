export const handleUseItem = (item, setPlayerStats) => {
  if (item.name === "Takeaway Meal") {
    setPlayerStats((prev) => {
      const idx = prev.items.findIndex((it) => it.name === item.name);
      if (idx === -1) return prev;

      const items = [...prev.items];
      items[idx] = { ...items[idx], quantity: items[idx].quantity - 1 };
      const cleaned = items.filter((it) => it.quantity > 0);

      const energy = Math.min(100, prev.energy + 25);
      const meal = Math.min(100, prev.meal + 40);

      return { ...prev, energy, meal, items: cleaned };
    });
  }
};
