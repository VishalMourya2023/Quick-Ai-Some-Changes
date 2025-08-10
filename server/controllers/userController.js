import sql from "../configs/db.js";

export const getUserCreations = async (req, res) => {
    try {
        const { userId } = req.auth(); // Destructure properly with {}
        const creations = await sql`
            SELECT * FROM creations 
            WHERE user_id = ${userId} 
            ORDER BY created_at DESC`;
        res.json({ success: true, creations });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getPublishedCreations = async (req, res) => {
  try {
    const creations = await sql`
      SELECT * FROM creations 
      WHERE publish = true  
      ORDER BY created_at DESC`;
    res.json({ success: true, creations });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const togglelikecreation = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const [creation] = await sql`SELECT * FROM creations WHERE id = ${id}`;
    if (!creation) {
      return res.json({ success: false, message: "Creation not found" });
    }

    const currentLikes = creation.likes || []; // Ensure it's a valid array
    const userIdStr = userId.toString();
    let updatedLikes;
    let message;

    if (currentLikes.includes(userIdStr)) {
      updatedLikes = currentLikes.filter((user) => user !== userIdStr);
      message = "Creation Unliked";
    } else {
      updatedLikes = [...currentLikes, userIdStr];
      message = "Creation Liked";
    }

    // Convert JS array to Postgres array syntax: '{user1,user2,...}'
    const formattedArray = `{${updatedLikes.join(",")}}`;

    // 🔁 Update likes array (renamed from "like" to "likes")
    await sql`UPDATE creations SET likes = ${formattedArray}::text[] WHERE id = ${id}`;

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.json({ success: false, message: error.message });
  }
};
