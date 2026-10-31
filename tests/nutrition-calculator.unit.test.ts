import { describe, it, expect } from 'vitest';
import { calculateNutrition } from '../src/nutrition-calculator.js';

describe('calculateNutrition', () => {
    it('should return nutrients for a given food', () => {
        const food = {
            calories: 100,
            protein: 20,
            carbs: 10,
            fat: 10,
        };

        const result = calculateNutrition(food, 50);

        expect(result).toEqual({
            calories: 50,
            protein: 10,
            carbs: 5,
            fat: 5,
        });
    });
});
