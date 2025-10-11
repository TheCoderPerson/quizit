/**
 * SM-2 Spaced Repetition Algorithm Implementation
 * Based on SuperMemo 2 algorithm by Piotr Wozniak
 *
 * This algorithm schedules cards for optimal learning by adjusting
 * review intervals based on user performance.
 *
 * Quality ratings:
 * 0 - Complete blackout (no recall)
 * 1 - Incorrect response, but remembered upon seeing answer
 * 2 - Incorrect response, correct answer seemed easy to recall
 * 3 - Correct response, but required significant effort
 * 4 - Correct response, with some hesitation
 * 5 - Perfect response, immediate recall
 */

class SRSAlgorithm {
    /**
     * Calculate the next review interval for a card based on performance
     *
     * @param {Object} card - The card object with SRS properties
     * @param {number} quality - Quality of recall (0-5)
     * @returns {Object} Updated card with new SRS values
     */
    static calculateNextReview(card, quality) {
        let { easeFactor, interval, repetitions } = card;

        // Quality must be between 0 and 5
        quality = Math.max(0, Math.min(5, quality));

        // If quality < 3, the card is forgotten - reset repetitions and interval
        if (quality < 3) {
            repetitions = 0;
            interval = 0;
        } else {
            // Correct answer - increase repetitions
            repetitions += 1;

            // Calculate interval based on repetition number
            if (repetitions === 1) {
                interval = 1; // First correct: review in 1 day
            } else if (repetitions === 2) {
                interval = 6; // Second correct: review in 6 days
            } else {
                // Subsequent reviews: multiply previous interval by ease factor
                interval = Math.round(interval * easeFactor);
            }
        }

        // Update ease factor based on quality
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

        // Ease factor should never be less than 1.3
        easeFactor = Math.max(1.3, easeFactor);

        // Calculate next review date
        const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

        return {
            ...card,
            easeFactor,
            interval,
            repetitions,
            nextReview
        };
    }

    /**
     * Get priority score for a card (lower is higher priority)
     * Used to determine which cards should be shown first
     *
     * @param {Object} card - The card object
     * @returns {number} Priority score
     */
    static getCardPriority(card) {
        const now = Date.now();
        const daysSinceReview = (now - card.nextReview) / (24 * 60 * 60 * 1000);

        // Cards that are overdue get higher priority (lower score)
        // Cards with lower ease factor (harder cards) get higher priority
        // Cards with fewer repetitions get higher priority

        let priority = 0;

        // Overdue cards get negative priority (higher priority)
        if (daysSinceReview > 0) {
            priority -= daysSinceReview * 10;
        } else {
            priority += Math.abs(daysSinceReview);
        }

        // Harder cards (lower ease factor) get higher priority
        priority += (3 - card.easeFactor) * 5;

        // Cards with fewer repetitions get slightly higher priority
        priority += (10 - card.repetitions) * 0.5;

        return priority;
    }

    /**
     * Sort cards by priority for studying
     *
     * @param {Array} cards - Array of card objects
     * @returns {Array} Sorted array of cards
     */
    static sortCardsByPriority(cards) {
        return cards.sort((a, b) => {
            return this.getCardPriority(a) - this.getCardPriority(b);
        });
    }

    /**
     * Determine if a card is due for review
     *
     * @param {Object} card - The card object
     * @returns {boolean} True if card is due for review
     */
    static isCardDue(card) {
        return card.nextReview <= Date.now();
    }

    /**
     * Get study statistics for a card
     *
     * @param {Object} card - The card object
     * @returns {Object} Statistics object
     */
    static getCardStudyStatus(card) {
        const isNew = card.repetitions === 0;
        const isDue = this.isCardDue(card);
        const daysSinceReview = Math.floor((Date.now() - card.nextReview) / (24 * 60 * 60 * 1000));

        let status;
        if (isNew) {
            status = 'new';
        } else if (isDue) {
            status = 'review';
        } else {
            status = 'learning';
        }

        // Determine difficulty level
        let difficulty;
        if (card.easeFactor >= 2.5) {
            difficulty = 'easy';
        } else if (card.easeFactor >= 2.0) {
            difficulty = 'medium';
        } else {
            difficulty = 'hard';
        }

        // Determine mastery level
        let mastery;
        if (card.repetitions === 0) {
            mastery = 0;
        } else if (card.repetitions < 3) {
            mastery = 33;
        } else if (card.repetitions < 6) {
            mastery = 66;
        } else {
            mastery = 100;
        }

        return {
            status,
            difficulty,
            mastery,
            isNew,
            isDue,
            daysSinceReview: isDue ? daysSinceReview : -daysSinceReview,
            nextReviewDate: new Date(card.nextReview)
        };
    }

    /**
     * Get recommended study session size based on available cards
     *
     * @param {Array} cards - Array of all cards
     * @returns {Object} Recommended session configuration
     */
    static getRecommendedSession(cards) {
        const dueCards = cards.filter(c => this.isCardDue(c));
        const newCards = cards.filter(c => c.repetitions === 0);
        const learningCards = cards.filter(c => !this.isCardDue(c) && c.repetitions > 0);

        const totalDue = dueCards.length;
        const totalNew = newCards.length;

        // Recommended session: mix of due cards and new cards
        // Ratio: 3 due cards to 1 new card
        let recommendedDue = Math.min(totalDue, 15);
        let recommendedNew = Math.min(totalNew, Math.floor(recommendedDue / 3) || 5);

        return {
            totalCards: cards.length,
            dueCards: totalDue,
            newCards: totalNew,
            learningCards: learningCards.length,
            recommendedDue,
            recommendedNew,
            recommendedTotal: recommendedDue + recommendedNew
        };
    }

    /**
     * Map quality ratings from simplified ratings to SM-2 scale
     *
     * @param {number} simpleRating - Simplified rating (1-4)
     * @returns {number} SM-2 quality (0-5)
     */
    static mapSimpleRatingToQuality(simpleRating) {
        // Map simple ratings to SM-2 quality:
        // 1 (Again) -> 0 (complete blackout)
        // 2 (Hard) -> 3 (correct with difficulty)
        // 3 (Good) -> 4 (correct with hesitation)
        // 4 (Easy) -> 5 (perfect recall)

        const mapping = {
            1: 0,
            2: 3,
            3: 4,
            4: 5
        };

        return mapping[simpleRating] || 3;
    }

    /**
     * Get interval string for display
     *
     * @param {number} interval - Interval in days
     * @returns {string} Human-readable interval
     */
    static formatInterval(interval) {
        if (interval === 0) {
            return 'Now';
        } else if (interval < 1) {
            return 'Less than a day';
        } else if (interval === 1) {
            return '1 day';
        } else if (interval < 30) {
            return `${interval} days`;
        } else if (interval < 365) {
            const months = Math.round(interval / 30);
            return `${months} month${months > 1 ? 's' : ''}`;
        } else {
            const years = Math.round(interval / 365);
            return `${years} year${years > 1 ? 's' : ''}`;
        }
    }
}

export default SRSAlgorithm;
