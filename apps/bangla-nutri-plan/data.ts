import { WeeklyPlan } from './types';

export const weeklyPlanData: WeeklyPlan = [
  {
    day: 1,
    meals: [
      { id: 'd1-b', name: 'Ruti & Vegetable Bhaji', emoji: '🌅', description: '2 medium rutis, mixed vegetable curry', calories: 350, weight: 300, isRiceMeal: false, breakdown: [{ item: 'Ruti (2pcs)', calories: 180 }, { item: 'Vegetable Bhaji', calories: 170 }] },
      { id: 'd1-l', name: 'Chicken Curry & Rice', emoji: '☀️', description: '1 cup steamed rice, chicken curry, pui shaak', calories: 600, weight: 500, isRiceMeal: true, breakdown: [{ item: 'Steamed Rice (1 cup)', calories: 205 }, { item: 'Chicken Curry (1 bowl)', calories: 300 }, { item: 'Pui Shaak Bhaji', calories: 95 }] },
      { id: 'd1-s', name: 'Apple & Nuts', emoji: '🍎', description: '1 medium apple, handful of almonds', calories: 200, weight: 150, isRiceMeal: false, breakdown: [{ item: 'Apple', calories: 95 }, { item: 'Almonds', calories: 105 }] },
      { id: 'd1-d', name: 'Fish Bhuna & Rice', emoji: '🌙', description: '1 cup steamed rice, rui maach bhuna, dal', calories: 550, weight: 450, isRiceMeal: true, breakdown: [{ item: 'Steamed Rice (1 cup)', calories: 205 }, { item: 'Rui Fish Bhuna', calories: 250 }, { item: 'Lentil Soup (Dal)', calories: 95 }] },
    ],
  },
  {
    day: 2,
    meals: [
      { id: 'd2-b', name: 'Paratha & Egg Omelette', emoji: '🌅', description: '1 paratha, 2-egg omelette', calories: 450, weight: 250, isRiceMeal: false, breakdown: [{ item: 'Paratha (1pc)', calories: 250 }, { item: 'Egg Omelette (2 eggs)', calories: 200 }] },
      { id: 'd2-l', name: 'Beef Bhuna & Rice', emoji: '☀️', description: '1 cup steamed rice, beef curry, salad', calories: 700, weight: 550, isRiceMeal: true, breakdown: [{ item: 'Steamed Rice (1 cup)', calories: 205 }, { item: 'Beef Bhuna', calories: 400 }, { item: 'Mixed Salad', calories: 95 }] },
      { id: 'd2-s', name: 'Yogurt', emoji: '🍎', description: '1 cup of plain yogurt', calories: 150, weight: 200, isRiceMeal: false, breakdown: [{ item: 'Plain Yogurt (1 cup)', calories: 150 }] },
      { id: 'd2-d', name: 'Vegetable Khichuri', emoji: '🌙', description: '1.5 cups of mixed vegetable khichuri', calories: 500, weight: 500, isRiceMeal: true, breakdown: [{ item: 'Vegetable Khichuri', calories: 500 }] },
    ],
  },
   {
    day: 3,
    meals: [
      { id: 'd3-b', name: 'Suji Halwa & Milk', emoji: '🌅', description: '1 bowl of suji, 1 glass of milk', calories: 400, weight: 350, isRiceMeal: false, breakdown: [{ item: 'Suji Halwa', calories: 250 }, { item: 'Milk (1 glass)', calories: 150 }] },
      { id: 'd3-l', name: 'Ilish Bhaja & Rice', emoji: '☀️', description: '1 cup steamed rice, fried hilsa, begun bhorta', calories: 650, weight: 500, isRiceMeal: true, breakdown: [{ item: 'Steamed Rice (1 cup)', calories: 205 }, { item: 'Fried Ilish', calories: 350 }, { item: 'Begun Bhorta', calories: 95 }] },
      { id: 'd3-s', name: 'Banana', emoji: '🍎', description: '2 medium bananas', calories: 210, weight: 200, isRiceMeal: false, breakdown: [{ item: 'Banana (2pcs)', calories: 210 }] },
      { id: 'd3-d', name: 'Chicken & Vegetable Soup', emoji: '🌙', description: 'Large bowl of homemade soup', calories: 400, weight: 600, isRiceMeal: false, breakdown: [{ item: 'Chicken & Veg Soup', calories: 400 }] },
    ],
  },
   {
    day: 4,
    meals: [
      { id: 'd4-b', name: 'Chira & Doi', emoji: '🌅', description: 'Flattened rice with yogurt and banana', calories: 380, weight: 400, isRiceMeal: false, breakdown: [{ item: 'Chira & Doi mix', calories: 380 }] },
      { id: 'd4-l', name: 'Mutton Rezala & Rice', emoji: '☀️', description: '1 cup rice, mutton rezala, salad', calories: 750, weight: 550, isRiceMeal: true, breakdown: [{ item: 'Steamed Rice (1 cup)', calories: 205 }, { item: 'Mutton Rezala', calories: 450 }, { item: 'Salad', calories: 95 }] },
      { id: 'd4-s', name: 'Singara', emoji: '🍎', description: '2 pieces of vegetable singara', calories: 300, weight: 150, isRiceMeal: false, breakdown: [{ item: 'Singara (2pcs)', calories: 300 }] },
      { id: 'd4-d', name: 'Shrimp Curry & Rice', emoji: '🌙', description: '1 cup rice, chingri malai curry, dal', calories: 600, weight: 500, isRiceMeal: true, breakdown: [{ item: 'Steamed Rice (1 cup)', calories: 205 }, { item: 'Shrimp Malai Curry', calories: 300 }, { item: 'Dal', calories: 95 }] },
    ],
  },
   {
    day: 5,
    meals: [
      { id: 'd5-b', name: 'Bread & Jelly', emoji: '🌅', description: '2 slices of toast with jelly', calories: 250, weight: 100, isRiceMeal: false, breakdown: [{ item: 'Toast (2 slices)', calories: 160 }, { item: 'Jelly', calories: 90 }] },
      { id: 'd5-l', name: 'Fish Paturi & Rice', emoji: '☀️', description: '1 cup rice, bhetki paturi, stir-fried vegetables', calories: 620, weight: 500, isRiceMeal: true, breakdown: [{ item: 'Steamed Rice (1 cup)', calories: 205 }, { item: 'Bhetki Paturi', calories: 300 }, { item: 'Stir-fried Veg', calories: 115 }] },
      { id: 'd5-s', name: 'Orange', emoji: '🍎', description: '1 medium orange', calories: 62, weight: 130, isRiceMeal: false, breakdown: [{ item: 'Orange', calories: 62 }] },
      { id: 'd5-d', name: 'Mixed Vegetable & Ruti', emoji: '🌙', description: '2 rutis, mixed vegetable curry', calories: 450, weight: 400, isRiceMeal: false, breakdown: [{ item: 'Ruti (2pcs)', calories: 180 }, { item: 'Mixed Vegetable Curry', calories: 270 }] },
    ],
  },
  {
    day: 6,
    meals: [
      { id: 'd6-b', name: 'Luchi & Alur Dom', emoji: '🌅', description: '3 luchis, small bowl of alur dom', calories: 550, weight: 350, isRiceMeal: false, breakdown: [{ item: 'Luchi (3pcs)', calories: 300 }, { item: 'Alur Dom', calories: 250 }] },
      { id: 'd6-l', name: 'Biryani (Chicken)', emoji: '☀️', description: '1 plate of chicken biryani with salad', calories: 800, weight: 600, isRiceMeal: true, breakdown: [{ item: 'Chicken Biryani', calories: 750 }, { item: 'Raita/Salad', calories: 50 }] },
      { id: 'd6-s', name: 'Peyaju', emoji: '🍎', description: '3 pieces of lentil fritters', calories: 240, weight: 100, isRiceMeal: false, breakdown: [{ item: 'Peyaju (3pcs)', calories: 240 }] },
      { id: 'd6-d', name: 'Light Khichuri & Egg', emoji: '🌙', description: '1 cup light khichuri, 1 boiled egg', calories: 450, weight: 400, isRiceMeal: true, breakdown: [{ item: 'Light Khichuri', calories: 370 }, { item: 'Boiled Egg', calories: 80 }] },
    ],
  },
  {
    day: 7,
    meals: [
      { id: 'd7-b', name: 'Oats with Fruits', emoji: '🌅', description: '1 bowl of oats with mixed fruits', calories: 300, weight: 300, isRiceMeal: false, breakdown: [{ item: 'Oats', calories: 150 }, { item: 'Mixed Fruits', calories: 150 }] },
      { id: 'd7-l', name: 'Leftover Biryani', emoji: '☀️', description: 'Remaining biryani from yesterday', calories: 600, weight: 450, isRiceMeal: true, breakdown: [{ item: 'Leftover Biryani', calories: 600 }] },
      { id: 'd7-s', name: 'Tea & Biscuits', emoji: '🍎', description: '1 cup of tea with 2 biscuits', calories: 150, weight: 100, isRiceMeal: false, breakdown: [{ item: 'Tea', calories: 50 }, { item: 'Biscuits', calories: 100 }] },
      { id: 'd7-d', name: 'Grilled Chicken & Vegetables', emoji: '🌙', description: '1 chicken breast, grilled vegetables', calories: 450, weight: 400, isRiceMeal: false, breakdown: [{ item: 'Grilled Chicken', calories: 300 }, { item: 'Grilled Vegetables', calories: 150 }] },
    ],
  },
];
