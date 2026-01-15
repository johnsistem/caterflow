import { useState, useMemo } from 'react';

export interface IngredientItem {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  quantity: number;
}

export function useRecipeCalculator(initialIngredients: IngredientItem[] = [], initialMargin = 0.3) {
  const [ingredients, setIngredients] = useState<IngredientItem[]>(initialIngredients);
  const [margin, setMargin] = useState(initialMargin);

  const addIngredient = (ingredient: IngredientItem) => {
    setIngredients((prev) => [...prev, ingredient]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const updateIngredientQuantity = (id: string, quantity: number) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
  };

  const calculations = useMemo(() => {
    const totalCost = ingredients.reduce(
      (acc, item) => acc + item.costPerUnit * item.quantity,
      0
    );
    
    // Calculate price based on desired margin: Price = Cost / (1 - Margin%)
    // Example: Cost 70, Margin 30% -> Price = 70 / 0.7 = 100
    const safeMargin = Math.min(Math.max(margin, 0), 0.99);
    const suggestedPrice = totalCost / (1 - safeMargin);
    const profit = suggestedPrice - totalCost;

    return {
      totalCost,
      suggestedPrice,
      profit,
    };
  }, [ingredients, margin]);

  return {
    ingredients,
    margin,
    setMargin,
    addIngredient,
    removeIngredient,
    updateIngredientQuantity,
    ...calculations,
  };
}
