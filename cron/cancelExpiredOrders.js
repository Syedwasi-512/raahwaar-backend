const cron = require("node-cron");
const Order = require("../models/Order");

cron.schedule("*/30 * * * *", async () => {
  try {
    const result = await Order.updateMany(
      {
        status: "pending",
        confirmationTokenExpires: { $lt: new Date() },
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
          confirmationToken: null,
          confirmationTokenExpires: null,
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`🛑 ${result.modifiedCount} expired orders cancelled`);
    }
    
  } catch (error) {
    console.error("Cron error:", err);
  }
});
