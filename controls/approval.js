const Approval = require("../models/Approval");
const User = require("../models/User");
const Expense = require("../models/Expense");

exports.sendApprovalRequest = async (req, res) => {
  const userId = req.userId; // userId from auth middleware

  try {
    await Approval.deleteMany(); //deleting excisting collections
    const users = await User.find({ active: true }); //get active users

    // create new approval request
    const newApprove = await Approval.create({
      requesterId: userId,
      totalApprovar: users.length,
      approverId: [userId],
    });
    const response = await Approval.findOne().populate({
      path: "approverId",
      select: ["fullName"],
    });
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.approved = async (req, res) => {
  const userId = req.userId; // userId from auth middleware

  const { approvalId } = req.params; //active approval id from query params
  try {
    const approval = await Approval.findById(approvalId); //get active approval collection

    // update approved user id
    const update = {
      ...approval._doc,
      approverId: [...approval._doc.approverId, userId],
    };
    const result = await Approval.updateOne({ _id: approvalId }, update);
    const response = await Approval.findOne().populate({
      path: "approverId",
      select: ["fullName"],
    });

    //  if total active users greater than or equel to total approved
    //  user ids delete the entire approval collection and all live expence change to false
    if (update.approverId.length >= approval.totalApprovar) {
      await Approval.deleteMany();
      const status = await Expense.updateMany(
        { isLive: true },
        { isLive: false }
      );
      res.json(response);
    } else {
      res.status(200).json(response);
    }
  } catch (error) {
    res.status(404).json(error.message);
  }
};

exports.deleteCloseRequest = async (req, res) => {
  try {
    const response = await Approval.deleteMany();
    res.status(200).json("Deleted");
  } catch (error) {
    res.status(401).json("Something went wrong");
  }
};
