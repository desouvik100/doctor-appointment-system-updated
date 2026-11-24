

'use strict';

const LoyaltyPoints = require('../models/LoyaltyPoints');
const POINTS_CONFIG = {
  appointment: 50,
  referral:    200,
  review:      30,
  signup:      100,
  birthday:    500,
  tierMultiplier: { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2 },
};
const ACTION_TO_TYPE = {
  appointment: 'earned',
  review:      'earned',
  signup:      'earned',
  birthday:    'bonus',
  referral:    'referral',
};

const awardLoyaltyPoints = async (
  userId,
  action,
  referenceId,
  customPoints = null,
  description  = null,
) => {
  if (!userId) {
    console.warn('[LOYALTY] Skipped — no userId provided');
    return { success: false, error: 'No userId' };
  }

  try {
    const transactionType = ACTION_TO_TYPE[action] || 'earned';
    let loyalty = await LoyaltyPoints.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ userId });
    }
    const basePoints  = customPoints ?? (POINTS_CONFIG[action] ?? 0);
    const multiplier  = POINTS_CONFIG.tierMultiplier[loyalty.tier] ?? 1;
    const points      = Math.floor(basePoints * multiplier);

    const desc = description || `Earned ${points} points for ${action}`;
    loyalty.addPoints(points, transactionType, desc, referenceId);

    await loyalty.save();

    console.log(
      `[LOYALTY] ✅ Awarded ${points} pts to user ${userId}` +
      ` | action=${action} type=${transactionType} tier=${loyalty.tier}`
    );

    return { success: true, points, tier: loyalty.tier };

  } catch (error) {
    console.error(
      `[LOYALTY] ❌ FAILED for user ${userId} action=${action}` +
      ` — booking is unaffected`
    );
    console.error('[LOYALTY] Error name   :', error.name);
    console.error('[LOYALTY] Error message:', error.message);
    if (error.name === 'ValidationError') {
      const fields = Object.entries(error.errors || {})
        .map(([k, v]) => `${k}: ${v.message}`)
        .join(', ');
      console.error('[LOYALTY] Validation  :', fields);
    }

    return { success: false, error: error.message };
  }
};

module.exports = { awardLoyaltyPoints };
