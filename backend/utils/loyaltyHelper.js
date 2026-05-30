/**
 * loyaltyHelper.js
 *
 * DESIGN CONTRACT:
 *   awardLoyaltyPoints() is a NON-CRITICAL side effect.
 *   It MUST NEVER throw. It MUST NEVER block the booking response.
 *   Any failure is logged and silently swallowed.
 *
 * Callers should treat the return value as advisory only:
 *   const result = await awardLoyaltyPoints(...)
 *   // result.success === false means points were not awarded — booking still succeeds
 */

'use strict';

const LoyaltyPoints = require('../models/LoyaltyPoints');

// Points awarded per action
const POINTS_CONFIG = {
  appointment: 50,
  referral:    200,
  review:      30,
  signup:      100,
  birthday:    500,
  tierMultiplier: { bronze: 1, silver: 1.25, gold: 1.5, platinum: 2 },
};

// Map semantic action names → valid LoyaltyPoints.transactions.type enum values
// Schema enum: ['earned', 'redeemed', 'expired', 'bonus', 'referral']
const ACTION_TO_TYPE = {
  appointment: 'earned',
  review:      'earned',
  signup:      'earned',
  birthday:    'bonus',
  referral:    'referral',
};

/**
 * Award loyalty points to a user for a given action.
 *
 * @param {string}  userId       - MongoDB ObjectId string of the user
 * @param {string}  action       - Semantic action: 'appointment' | 'referral' | 'review' | 'signup' | 'birthday'
 * @param {*}       referenceId  - Reference entity ID (e.g. appointmentId)
 * @param {number}  [customPoints] - Override default points for this action
 * @param {string}  [description]  - Human-readable transaction description
 *
 * @returns {Promise<{ success: boolean, points?: number, tier?: string, error?: string }>}
 *   Always resolves — never rejects.
 */
const awardLoyaltyPoints = async (
  userId,
  action,
  referenceId,
  customPoints = null,
  description  = null,
) => {
  // Guard: missing userId means nothing to award
  if (!userId) {
    console.warn('[LOYALTY] Skipped — no userId provided');
    return { success: false, error: 'No userId' };
  }

  try {
    // Resolve valid transaction type — default to 'earned' for unknown actions
    const transactionType = ACTION_TO_TYPE[action] || 'earned';

    // Find or create the loyalty record
    let loyalty = await LoyaltyPoints.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyPoints({ userId });
    }

    // Calculate points with tier multiplier
    const basePoints  = customPoints ?? (POINTS_CONFIG[action] ?? 0);
    const multiplier  = POINTS_CONFIG.tierMultiplier[loyalty.tier] ?? 1;
    const points      = Math.floor(basePoints * multiplier);

    const desc = description || `Earned ${points} points for ${action}`;

    // addPoints() pushes to transactions array with the valid enum type
    loyalty.addPoints(points, transactionType, desc, referenceId);

    await loyalty.save();

    console.log(
      `[LOYALTY] ✅ Awarded ${points} pts to user ${userId}` +
      ` | action=${action} type=${transactionType} tier=${loyalty.tier}`
    );

    return { success: true, points, tier: loyalty.tier };

  } catch (error) {
    // Log the full error for debugging — but NEVER re-throw
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
