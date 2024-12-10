// src/controllers/moduleController.ts
import { Request, Response } from "express";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";
import { EModulePageContentType, EResourceType } from "../schema";

// Helper function to randomly select a content type
function getRandomContentType(): EModulePageContentType {
  const contentTypes = [
    EModulePageContentType.Text,
    EModulePageContentType.Image,
    EModulePageContentType.SmallInputField,
    EModulePageContentType.LargeInputField,
  ];
  return contentTypes[Math.floor(Math.random() * contentTypes.length)];
}

// Utility function to create dynamic page content with multiple types
function generatePageContent(pageNumber: number): any[] {
  const contentItems = [];
  const contentCount = Math.floor(Math.random() * 3) + 1; // Generate 1 to 3 content items per page

  for (let i = 0; i < contentCount; i++) {
    // Randomly select a content type for variety
    const contentType = getRandomContentType();

    let contentItem: any;

    switch (contentType) {
      case EModulePageContentType.Text:
        contentItem = {
          position: i,
          type: EModulePageContentType.Text,
          title: `Text ${i + 1}`,
          placeHolderText: `This is placeholder text for page ${pageNumber}, content ${
            i + 1
          }`,
        };
        break;

      case EModulePageContentType.Image:
        contentItem = {
          position: i,
          type: EModulePageContentType.Image,
          title: `Image ${i + 1}`,
          placeHolderText: "",
          imageUrl: `https://www.w3schools.com/w3images/lights.jpg`, // Replace with more varied URLs if needed
        };
        break;

      case EModulePageContentType.SmallInputField:
        contentItem = {
          position: i,
          type: EModulePageContentType.SmallInputField,
          title: `Small Input ${i + 1}`,
          placeHolderText: `Enter a short response for page ${pageNumber}, item ${
            i + 1
          }`,
        };
        break;

      case EModulePageContentType.LargeInputField:
        contentItem = {
          position: i,
          type: EModulePageContentType.LargeInputField,
          title: `Large Input ${i + 1}`,
          placeHolderText: `Enter a detailed response for page ${pageNumber}, item ${
            i + 1
          }`,
        };
        break;

      default:
        contentItem = {
          position: i,
          type: EModulePageContentType.Text,
          title: `Text ${i + 1}`,
          placeHolderText: `This is placeholder text for page ${pageNumber}, content ${
            i + 1
          }`,
        };
        break;
    }

    contentItems.push(contentItem);
  }

  return contentItems;
}

// Function to generate a module with pages and dynamic content
function generateModuleData(
  title: string,
  imageUrl: string,
  createdBy: string
) {
  const pages = [];
  const pageCount = Math.floor(Math.random() * 5) + 3; // Generate 3 to 7 pages

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    pages.push({
      pageNumber,
      content: generatePageContent(pageNumber),
    });
  }

  return {
    title,
    imageUrl,
    pages,
    createdBy: db.doc(`users/${createdBy}`),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

// Controller function to create a single module
export async function createModule(req: Request, res: Response) {
  try {
    const usersSnapshot = await db
      .collection("users")
      .where("role", "==", "Admin")
      .where("isSuperAdmin", "==", true)
      .limit(1)
      .get();
    if (usersSnapshot.empty) {
      return res.status(400).json({ message: "No super admin user found" });
    }

    const superAdminId = usersSnapshot.docs[0].id;

    // Generate a dynamic module
    const moduleData = generateModuleData(
      "Dynamic Module Title",
      "https://www.w3schools.com/w3images/lights.jpg",
      superAdminId
    );

    const moduleRef = await db.collection("modules").add(moduleData);
    res
      .status(201)
      .json({ message: "Module created successfully", id: moduleRef.id });
  } catch (error) {
    res.status(500).json({ message: "Error creating module", error });
  }
}

// Controller function to create multiple modules (bulk)
export async function createBulkModules(req: Request, res: Response) {
  try {
    const usersSnapshot = await db
      .collection("users")
      .where("role", "==", "Admin")
      .where("isSuperAdmin", "==", true)
      .limit(1)
      .get();
    if (usersSnapshot.empty) {
      return res.status(400).json({ message: "No super admin user found" });
    }

    const superAdminId = usersSnapshot.docs[0].id;

    const modulePromises = [];
    for (let i = 0; i < 4; i++) {
      // Creating at least 4 modules
      const title = `Module ${i + 1} Title`;
      const imageUrl = `https://www.w3schools.com/w3images/image${i + 1}.jpg`; // Replace with actual URLs as needed
      const moduleData = generateModuleData(title, imageUrl, superAdminId);
      modulePromises.push(db.collection("modules").add(moduleData));
    }

    // Execute all promises
    const moduleRefs = await Promise.all(modulePromises);
    res
      .status(201)
      .json({ message: `${moduleRefs.length} modules created successfully` });
  } catch (error) {
    res.status(500).json({ message: "Error creating modules", error });
  }
}

export async function deleteAllModules(req: Request, res: Response) {
  try {
    const assessmentsSnapshot = await db.collection("modules").get();
    const deletePromises = assessmentsSnapshot.docs.map((doc) =>
      doc.ref.delete()
    );
    await Promise.all(deletePromises);

    res.status(200).json({ message: "All modules deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting modules", error });
  }
}
