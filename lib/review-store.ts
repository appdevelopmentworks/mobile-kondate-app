import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RecipeReview } from './types';

interface ReviewStore {
  reviews: RecipeReview[];
  addReview: (review: Omit<RecipeReview, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReview: (id: string, updates: Partial<RecipeReview>) => void;
  deleteReview: (id: string) => void;
  getReviewsByRecipe: (recipeId: string) => RecipeReview[];
  getAverageRating: (recipeId: string) => number;
  getReviewsByMeal: (mealId: string) => RecipeReview[];
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],

      addReview: (reviewData) => {
        const newReview: RecipeReview = {
          ...reviewData,
          id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          reviews: [newReview, ...state.reviews]
        }));
      },

      updateReview: (id, updates) => {
        set((state) => ({
          reviews: state.reviews.map((review) =>
            review.id === id
              ? { ...review, ...updates, updatedAt: new Date() }
              : review
          ),
        }));
      },

      deleteReview: (id) => {
        set((state) => ({
          reviews: state.reviews.filter((review) => review.id !== id),
        }));
      },

      getReviewsByRecipe: (recipeId) => {
        return get().reviews.filter((review) => review.recipeId === recipeId);
      },

      getAverageRating: (recipeId) => {
        const recipeReviews = get().reviews.filter((review) => review.recipeId === recipeId);
        if (recipeReviews.length === 0) return 0;
        
        const totalRating = recipeReviews.reduce((sum, review) => sum + review.rating, 0);
        return totalRating / recipeReviews.length;
      },

      getReviewsByMeal: (mealId) => {
        return get().reviews.filter((review) => review.mealId === mealId);
      },
    }),
    {
      name: 'recipe-reviews-storage',
    }
  )
);