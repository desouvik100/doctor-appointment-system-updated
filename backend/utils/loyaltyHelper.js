const LoyaltyPoints = require('../models/LoyaltyPoints');

/**
 * Helper function to award loyalty points to a user
 * @param {string} userId - ID of the user
 * @param {string} action - Action triggering the award (e.g. 'appointment', 'referral', 'review')
 * @param {string} referenceId - Reference entity ID (e.g. appointmentId)
 * @param {number} [customPoints] - Custom points value to award
 * @param {string} [description] - Custom transaction description
 * @returns {Promise<{success: boolean, points?: number, tier?: string, error?: string}>}
 */
const awardLoyaltyPoints = async (userId, action, referenceId, customPoints = null, description = null) => {
  try {
    const POINTS_CONFIG = {
      appointment: 50,
      referral: 200,
      review: 30,
      signup: 100,
      birthday: 500,
      tierMultiplier: { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2 }
    };

    // Map action to a valid transactions.type enum value:
    // Schema enum: ['earned', 'redeemed', 'expired', 'bonus', 'referral']
    const ACTION_TO_TYPE = {
      appointment: 'earned',
      review:      'earned',
      signup:      'earned',
      birthday:    'bonus',
      referral:    'referral',
    };
    const transactionType = ACTION_TO_TYPE[action] || 'earned';

    let loyalty = await LoyaltyPoints.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ userId });
    }

    let points = customPoints || POINTS_CONFIG[action] || 0;
    const multiplier = POINTS_CONFIG.tierMultiplier[loyalty.tier] || 1;
    points = Math.floor(points * multiplier);

    const desc = description || `Earned ${points} points for ${action}`;
    // Pass the valid enum type, not the raw action string
    loyalty.addPoints(points, transactionType, desc, referenceId);
    await loyalty.save();

    console.log(`🎁 Awarded ${points} loyalty points to user ${userId} for ${action} (type: ${transactionType})`);
    return { success: true, points, tier: loyalty.tier };
  } catch (error) {
    console.error('Error awarding loyalty points:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  awardLoyaltyPoints
};
