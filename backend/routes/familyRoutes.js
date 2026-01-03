const express = require('express');
const router = express.Router();
const FamilyMember = require('../models/FamilyMember');

/**
 * @swagger
 * components:
 *   schemas:
 *     FamilyMember:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         primaryUserId:
 *           type: string
 *         name:
 *           type: string
 *         relationship:
 *           type: string
 *         dateOfBirth:
 *           type: string
 *           format: date
 *         gender:
 *           type: string
 *         phone:
 *           type: string
 *         bloodGroup:
 *           type: string
 *         isActive:
 *           type: boolean
 */

/**
 * @swagger
 * /family/user/{userId}:
 *   get:
 *     summary: Get family members for a user
 *     description: Retrieves all active family members for a specific user
 *     tags: [Family]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of family members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FamilyMember'
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const members = await FamilyMember.find({ primaryUserId: req.params.userId, isActive: true });
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /family:
 *   post:
 *     summary: Add a family member
 *     description: Adds a new family member to the user's account
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - primaryUserId
 *               - name
 *               - relationship
 *             properties:
 *               primaryUserId:
 *                 type: string
 *               name:
 *                 type: string
 *               relationship:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               phone:
 *                 type: string
 *               bloodGroup:
 *                 type: string
 *     responses:
 *       201:
 *         description: Family member added
 *       400:
 *         description: Validation error
 */
router.post('/', async (req, res) => {
  try {
    const member = new FamilyMember(req.body);
    await member.save();
    res.status(201).json({ message: 'Family member added', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /family/{id}:
 *   put:
 *     summary: Update a family member
 *     description: Updates an existing family member's information
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FamilyMember'
 *     responses:
 *       200:
 *         description: Family member updated
 *       404:
 *         description: Family member not found
 */
router.put('/:id', async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Updated successfully', member });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /family/{id}:
 *   delete:
 *     summary: Remove a family member
 *     description: Soft deletes a family member (sets isActive to false)
 *     tags: [Family]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Family member removed
 *       404:
 *         description: Family member not found
 */
router.delete('/:id', async (req, res) => {
  try {
    await FamilyMember.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Family member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
