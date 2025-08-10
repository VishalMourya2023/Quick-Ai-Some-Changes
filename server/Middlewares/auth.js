import { clerkClient } from "@clerk/express";

// 🛡️ Middleware to attach user plan and usage info to the request
export const auth = async (req, res, next) => {
  try { // await bolta hai: "Ruko, jab tak kaam pura nahi hota."
    // ✅ Clerk se logged-in user ka ID aur plan-checking function le rahe hain
    const { userId, has } = await req.auth(); // has -> Kya user ke paas specific plan, role, ya feature hai?

    // 🔍 Check kar rahe hain ki user ke paas premium plan hai ya nahi
    const hasPremiumPlan = await has({ plan: 'premium' });

    // 📥 Clerk se user ka full data fetch kar rahe hain
    const user = await clerkClient.users.getUser(userId);

    // 🔁 Agar user premium nahi hai aur free_usage already Clerk mein stored hai
    if (!hasPremiumPlan && user.privateMetadata.free_usage) {
      // 👉 Request object mein usage count attach kar do
      req.free_usage = user.privateMetadata.free_usage;
    } else {
      // 🆕 Agar usage data missing hai, to Clerk mein 0 se initialize karo
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: 0
        }
      });

      // 👇 Aur request object mein bhi set karo
      req.free_usage = 0;
    }

    // 📦 User ka plan set kar rahe hain request pe: 'premium' ya 'free'
    req.plan = hasPremiumPlan ? 'premium' : 'free';

    // ✅ Sab kuch sahi hai, to agle middleware ya route handler ko chalao
    next();

  } catch (error) {
    // ❌ Error aaya to JSON response mein error message bhejo
    res.json({ success: false, message: error.message });
  }
};
