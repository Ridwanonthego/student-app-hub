
export type ScoreCategory = 'Low' | 'Medium' | 'High' | 'Very High';

export const getScoreCategory = (score: number): ScoreCategory => {
    if (score < 40) return 'Low';
    if (score < 65) return 'Medium';
    if (score < 85) return 'High';
    return 'Very High';
};

export const getScoreColor = (score: number): { text: string, bg: string } => {
    const category = getScoreCategory(score);
    switch (category) {
        case 'Low':
            return { text: 'text-green-600', bg: 'bg-green-100' };
        case 'Medium':
            return { text: 'text-yellow-600', bg: 'bg-yellow-100' };
        case 'High':
            return { text: 'text-orange-600', bg: 'bg-orange-100' };
        case 'Very High':
            return { text: 'text-red-600', bg: 'bg-red-100' };
        default:
            return { text: 'text-gray-800', bg: 'bg-gray-100' };
    }
};
