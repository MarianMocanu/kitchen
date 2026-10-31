type Food = {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
};

export function calculateNutrition(food: Food, quantity: number) {
    // food has nutrients per 100g
    // we need to calculate the nutrients for the given quantity
    const calories = (food.calories / 100) * quantity;
    const protein = (food.protein / 100) * quantity;
    const carbs = (food.carbs / 100) * quantity;
    const fat = (food.fat / 100) * quantity;

    return { calories, protein, carbs, fat };
}
