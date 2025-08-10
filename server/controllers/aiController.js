import OpenAI from "openai";                 // 1. OpenAI SDK import kiya
import sql from "../configs/db.js";          // 2. SQL database connection import kiya
import { clerkClient } from "@clerk/express"
import axios from "axios";
import {v2 as cloudinary} from "cloudinary";
import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js'
// import pdf from 'pdf-parse';

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,    // 3. API key set ki — NOTE: yeh galat string hai
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});                                          // 4. OpenAI client ban gaya

export const generateArticle = async (req, res) => {  // 5. Express route handler define kiya
  try {
    const { userId } = req.auth();           // 6. Logged-in user ka ID liya Clerk se
    const { prompt, length } = req.body;     // 7. User ke prompt aur article length li
    const plan = req.plan;                   // 8. User ka plan (free/premium) check kiya
    const free_usage = req.free_usage;       // 9. Kitni baar free use kiya, uska count liya

    // 10. Free user ki limit cross ho gayi to block karo
    if (plan !== 'premium' && free_usage >= 10) {
        // Limit exceeded for free plan — ask user to upgrade
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    // 11. Gemini API se response lo
    const response = await AI.chat.completions.create({
        model: "gemini-2.0-flash", // Fast + cost-efficient model
        messages: [{ // User prompt as chat input
            role: "user",
            content: prompt,
        }],
        temperature : 0.7, // temperature controls how creative or random the AI's response will be.
        max_tokens : length, // Limit response length
    });

    // 12. AI se mila content extract karo
    const content = response.choices[0].message.content

    // 13. DB mein user ka prompt aur AI ka content save karo
    await sql`INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    // 14. Free user ke usage count mein +1 karo
    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }

    // 15. Final response user ko bhejo
    res.json({ success: true, content });

  } catch (error) {
    // 16. Error aaye to log aur error message bhejna
    console.error("🔥 Error in generateArticle:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const generateBlogTitle = async (req, res) => {  // 5. Express route handler define kiya
  try {
    const { userId } = req.auth();           // 6. Logged-in user ka ID liya Clerk se
    const { prompt } = req.body;     // 7. User ke prompt aur article length li
    const plan = req.plan;                   // 8. User ka plan (free/premium) check kiya
    const free_usage = req.free_usage;       // 9. Kitni baar free use kiya, uska count liya

    // 10. Free user ki limit cross ho gayi to block karo
    if (plan !== 'premium' && free_usage >= 10) {
        // Limit exceeded for free plan — ask user to upgrade
      return res.json({ success: false, message: "Limit reached. Upgrade to continue." });
    }

    // 11. Gemini API se response lo
    const response = await AI.chat.completions.create({
        model: "gemini-2.0-flash", // Fast + cost-efficient model
        messages: [{ role: "user", content: prompt,}],
        temperature : 0.7, // temperature controls how creative or random the AI's response will be.
        max_tokens : 100, // Limit response length
    });

    // 12. AI se mila content extract karo
    const content = response.choices[0].message.content

    // 13. DB mein user ka prompt aur AI ka content save karo
    await sql`INSERT INTO creations (user_id, prompt, content, type)
        VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    // 14. Free user ke usage count mein +1 karo
    if (plan !== 'premium') {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }

    // 15. Final response user ko bhejo
    res.json({ success: true, content });

  } catch (error) {
    // 16. Error aaye to log aur error message bhejna
    console.error("🔥 Error in generateArticle:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const generateImage = async (req, res) => {  // 5. Express route handler define kiya
  try {
    const { userId } = req.auth();           // 6. Logged-in user ka ID liya Clerk se
    const { prompt, publish } = req.body;     // 7. User ke prompt aur article length li
    const plan = req.plan;                   // 8. User ka plan (free/premium) check kiya

    // 10. Free user ki limit cross ho gayi to block karo
    if (plan !== 'premium') {
        // Limit exceeded for free plan — ask user to upgrade
      return res.json({ success: false, message: "This feature is only available for premium" });   
    }

    // 11. API se response lo
    const formData = new FormData();
    formData.append('prompt', prompt);

    const {data} = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
      headers: {
        'x-api-key': process.env.CLIPDROP_API_KEY,
      },
      responseType: "arraybuffer",
    });

    const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;
    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
    `;

    res.json({ success: true, content: secure_url });


  } catch (error) {
    // 16. Error aaye to log aur error message bhejna
    console.error("🔥 Error in generateArticle:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// =========================remove background ==============================
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth
    const image = req.file
    const plan = req.plan

    if (plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: 'This feature is only available for premium users.',
      })
    }

    if (!image) {
      return res
        .status(400)
        .json({ success: false, message: 'No image file uploaded.' })
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: 'background_removal',
          background_removal: 'remove_the_background',
        },
      ],
    })

    await sql`
      INSERT INTO creations (user_id, prompt, content, type, publish)
      VALUES (${userId}, 'remove background from image', ${secure_url}, 'image', false)
    `

    res.json({ success: true, content: secure_url })
  } catch (error) {
    console.error('🔥 Error in removeImageBackground:', error)
    res
      .status(500)
      .json({ success: false, message: 'Internal server error' })
  }
}

// =========================remove background ==============================
export const removeImageObject = async (req, res) => {  // 5. Express route handler define kiya
  try {
    const { userId } = req.auth();
    const { object } = req.body;            // 6. Logged-in user ka ID liya Clerk se
    const  image  = req.file;     // 7. User ke prompt aur article length li
    const plan = req.plan;                   // 8. User ka plan (free/premium) check kiya

    // 10. Free user ki limit cross ho gayi to block karo
    if (plan !== 'premium') {
        // Limit exceeded for free plan — ask user to upgrade
      return res.json({ success: false, message: "This feature is only available for premium" });   
    }

    // 11. API se response lo
    const { public_id } = await cloudinary.uploader.upload(image.path)
    
    const imageUrl = cloudinary.url(public_id, {
    transformation: [{ effect: `gen_remove:${object}` }],
    resource_type: 'image'
    });

    await sql`INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

    res.json({ success: true, content: imageUrl });

  } catch (error) {
    // 16. Error aaye to log aur error message bhejna
    console.error("🔥 Error in generateArticle:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// =========================remove background ==============================
export const resumeReview = async (req, res) => {  // 5. Express route handler define kiya
  try {
    const { userId } = req.auth();           // 6. Logged-in user ka ID liya Clerk se
    const resume = req.file;     // 7. User ke prompt aur article length li
    const plan = req.plan;                   // 8. User ka plan (free/premium) check kiya

    // 10. Free user ki limit cross ho gayi to block karo
    if (plan !== 'premium') {
        // Limit exceeded for free plan — ask user to upgrade
      return res.json({ success: false, message: "This feature is only available for premium" });   
    }

    if(resume.size > 5*1024*1024) {
      return res.json({success: false, message: "Resume file size exceeds allowed size (5MB)."})
    }

    const dataBuffer = fs.readFileSync(req.file.path);  // for uploaded file
    const pdfData = await pdf(dataBuffer)

    const prompt = `Review the following resume and provide constructive 
    feedback on its strengths, weaknesses, and areas for improvement. Resume 
    Content: \n\n${pdfData.text}`;

    // 11. Gemini API se response lo
    const response = await AI.chat.completions.create({
        model: "gemini-2.0-flash", // Fast + cost-efficient model
        messages: [{ role: "user", content: prompt }],
        temperature : 0.7, // temperature controls how creative or random the AI's response will be.
        max_tokens : 1000, // Limit response length
    });
    // 12. AI se mila content extract karo
    const content = response.choices[0].message.content

    await sql`INSERT INTO creations (user_id, prompt, content, type)
    VALUES (${userId}, 'Removed the uploaded Resume', ${content}, 'Resume-review')`;

    res.json({ success: true, content });

  } catch (error) {
    // 16. Error aaye to log aur error message bhejna
    console.error("🔥 Error in generateArticle:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};