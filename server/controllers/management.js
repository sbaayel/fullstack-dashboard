import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUserPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const userWithStats = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'affiliatestats',
          localField: '_id',
          foreignField: 'userId',
          as: 'affiliateStats',
        },
      },
      { $unwind: '$affiliateStats' },
    ]);

    if (userWithStats.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const saleTransactions = await Transaction.find({
      _id: { $in: userWithStats[0].affiliateStats.affiliateSales },
    });

    res.status(200).json({ user: userWithStats[0], sales: saleTransactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};