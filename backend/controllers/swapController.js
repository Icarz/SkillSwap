const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { emitNotification } = require("../config/socket");

// ✅ Propose a skill swap
const proposeSwap = async (req, res) => {
  const { id: targetTransactionId } = req.params; // The ID of the transaction user wants to swap for
  const { offeredSkillId } = req.body; // The ID of the skill the current user will offer

  try {
    // 1. Find the target transaction (the one the user wants to receive)
    const targetTransaction = await Transaction.findById(targetTransactionId)
      .populate("user", "name")
      .populate("skill", "name");

    if (!targetTransaction) {
      return res.status(404).json({ error: "Target transaction not found." });
    }

    // 2. Validate: Target must be a 'request'
    if (targetTransaction.type !== "request") {
      return res
        .status(400)
        .json({ error: "You can only propose a swap for a 'request'." });
    }

    // 3. Validate: User cannot propose a swap on their own request
    if (targetTransaction.user._id.toString() === req.user.id) {
      return res
        .status(400)
        .json({ error: "You cannot propose a swap on your own request." });
    }

    // 4. Validate: offeredSkillId must exist
    const Skill = require("../models/Skill");
    const skillExists = await Skill.exists({ _id: offeredSkillId });
    if (!skillExists) {
      return res.status(400).json({ error: "Offered skill not found." });
    }

    // 5. Create a new 'offer' transaction from the current user
    const offerTransaction = new Transaction({
      user: req.user.id,
      skill: offeredSkillId,
      type: "offer",
      status: "proposed-swap", // New status
      linkedTransaction: targetTransactionId, // Link to the target
      proposedSwap: targetTransactionId, // Track the proposal origin
    });

    // 6. Prevent overwriting an existing swap proposal
    if (targetTransaction.linkedTransaction) {
      return res
        .status(400)
        .json({ error: "A swap has already been proposed for this request." });
    }

    // Link the target transaction back to the new offer
    targetTransaction.linkedTransaction = offerTransaction._id;
    targetTransaction.status = "proposed-swap"; // Update target status

    // 7. Save both transactions — revert the first if the second fails
    await offerTransaction.save();
    try {
      await targetTransaction.save();
    } catch (saveErr) {
      await offerTransaction.deleteOne();
      throw saveErr;
    }

    // 8. Populate the data for the response and notification
    await offerTransaction.populate("skill", "name");
    await targetTransaction.populate("skill", "name");

    // 9. Send a real-time notification to the owner of the target request
    const proposer = await User.findById(req.user.id).select("name");
    const notificationMessage = `${proposer.name} has proposed a swap: their ${offerTransaction.skill.name} for your ${targetTransaction.skill.name}.`;

    // Call the function with the request object and the data
    emitNotification(req, {
      userId: targetTransaction.user._id, // The ID of the user to notify
      type: "swap-proposed",
      message: notificationMessage,
      transactionId: targetTransaction._id,
    });

    // 10. Return the newly created offer transaction
    res.status(201).json(offerTransaction);
  } catch (err) {
    console.error("Error proposing swap:", err);
    res.status(500).json({ error: "Failed to propose swap." });
  }
};

module.exports = { proposeSwap };
