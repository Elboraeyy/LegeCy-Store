"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitContactForm(prevState: any, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const subject = formData.get("subject") as string;
    const message = formData.get("message") as string;
    const attachment = formData.get("attachment") as File | null;

    if (!name || !email || !subject || !message) {
      return { success: false, message: "Please fill in all required fields." };
    }

    // In a real application, you would upload the file to storage (e.g., S3, Vercel Blob)
    // and get the URL. For now, we'll just store the filename if a file exists.
    let fileUrl = null;
    if (attachment && attachment.size > 0) {
      // Simulate upload by storing filename
      fileUrl = attachment.name; 
      
      // TODO: Implement actual file upload strategy
      // const buffer = Buffer.from(await attachment.arrayBuffer());
      // await uploadToStorage(buffer, attachment.name);
    }

    await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        fileUrl,
        status: "NEW",
      },
    });

    revalidatePath("/admin/messages"); // Assuming an admin page exists or will exist

    return { success: true, message: "Message sent successfully!" };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
