// src/controllers/resourceController.ts
import { Request, Response } from "express";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";
import { EResourceType } from "../schema";

// Utility function to randomly select items from an array
function getRandomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const textImages = [
  "https://www.w3schools.com/w3images/lights.jpg",
  "https://www.w3schools.com/w3images/nature.jpg",
  "https://www.w3schools.com/w3images/fjords.jpg",
];

const videoUrls = [
  "https://www.w3schools.com/html/mov_bbb.mp4",
  "https://www.w3schools.com/html/movie.mp4",
  "https://www.w3schools.com/html/horse.mp4",
];

function generateTitleAndDescription(
  tags: any[],
  areasOfFocus: any[]
): { title: string; description: string } {
  let title = "";
  let description = "";

  // Prioritize tags for title and description, if available
  if (tags.length > 0) {
    const tagNames = tags.map((tag) => tag.name);
    const primaryTag = tagNames[0];
    title = `Insights on ${primaryTag}`;
    description = `This resource explores aspects of ${primaryTag}, providing insights and techniques related to ${tagNames.join(
      ", "
    )}.`;
  }
  // If no tags, use areas of focus as the basis for title and description
  else if (areasOfFocus.length > 0) {
    const areaName = areasOfFocus[0].name;
    title = `${areaName} Guide`;
    description = `An in-depth guide covering essential aspects of ${areaName}. Learn more about techniques, tips, and resources to enhance your understanding of ${areaName}.`;
  }
  // Default title and description if neither tags nor areas of focus are available
  else {
    title = "General Wellness Resource";
    description =
      "Explore this resource for general wellness tips and insights.";
  }

  return { title, description };
}

export async function createResource(req: Request, res: Response) {
  try {
    const { title, type, content, createdBy } = req.body;

    // Validate required fields
    if (!title || !type || !content || !createdBy) {
      return res
        .status(400)
        .json({ message: "Title, type, content, and createdBy are required" });
    }

    // Ensure type is either Text or Video
    if (![EResourceType.Text, EResourceType.Video].includes(type)) {
      return res
        .status(400)
        .json({ message: "Invalid resource type. Must be 'Text' or 'Video'" });
    }

    // Step 1: Fetch all tags
    const tagsSnapshot = await db.collection("tags").get();
    const tags = tagsSnapshot.docs.map((doc) => doc.ref);

    // Step 2: Fetch all areas of focus
    const areasSnapshot = await db.collection("areasOfFocus").get();
    const areasOfFocus = areasSnapshot.docs.map((doc) => doc.ref);

    // Step 3: Randomly select one or more tags and one or more areas of focus
    const selectedTags = getRandomItems(tags, Math.min(2, tags.length)); // Select up to 2 tags
    const selectedAreasOfFocus = getRandomItems(
      areasOfFocus,
      Math.min(1, areasOfFocus.length)
    ); // Select 1 area of focus

    // Step 4: Define the resource data
    const resourceData = {
      type,
      title,
      areaOfFocus: selectedAreasOfFocus, // Assign randomly selected areas of focus
      tags: selectedTags, // Assign randomly selected tags
      imageUrl: req.body.imageUrl || "", // Optional image URL
      content,
      createdBy: db.doc(`users/${createdBy}`),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Step 5: Add the new resource to the resources collection
    const resourceRef = await db.collection("resources").add(resourceData);
    res
      .status(201)
      .json({ message: "Resource created successfully", id: resourceRef.id });
  } catch (error) {
    res.status(500).json({ message: "Error creating resource", error });
  }
}

async function generateRandomResource(createdBy: string) {
  // Step 1: Fetch all tags and areas of focus
  const tagsSnapshot = await db.collection("tags").get();
  const tags = tagsSnapshot.docs.map((doc) => ({
    ref: doc.ref,
    name: doc.data().name,
  }));

  const areasSnapshot = await db.collection("areasOfFocus").get();
  const areasOfFocus = areasSnapshot.docs.map((doc) => ({
    ref: doc.ref,
    name: doc.data().name,
  }));

  // Step 2: Randomly select tags and an area of focus
  const selectedTags = getRandomItems(tags, Math.min(2, tags.length)); // Select up to 2 tags
  const selectedAreasOfFocus = getRandomItems(
    areasOfFocus,
    Math.min(1, areasOfFocus.length)
  ); // Select 1 area of focus

  // Step 3: Generate meaningful title and description
  const { title, description } = generateTitleAndDescription(
    selectedTags,
    selectedAreasOfFocus
  );

  // Step 4: Randomly decide if the resource is Text or Video
  const isTextResource = Math.random() > 0.5;

  return {
    type: isTextResource ? EResourceType.Text : EResourceType.Video,
    title: title,
    description: description,
    areaOfFocus: selectedAreasOfFocus.map((focus) => focus.ref),
    tags: selectedTags.map((tag) => tag.ref),
    imageUrl: isTextResource ? getRandomItems(textImages, 1)[0] : "",
    content: isTextResource
      ? getRandomItems(textImages, 1)[0]
      : getRandomItems(videoUrls, 1)[0],
    createdBy: db.doc(`users/${createdBy}`),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

export async function createBulkResources(req: Request, res: Response) {
  try {
    // Step 1: Fetch a super admin user
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

    // Step 2: Generate and add 15 random resources
    const resources = [];
    for (let i = 0; i < 15; i++) {
      const resourceData = await generateRandomResource(superAdminId);
      resources.push(db.collection("resources").add(resourceData));
    }

    // Step 3: Execute all resource creation promises
    await Promise.all(resources);

    res.status(201).json({ message: "15 resources created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error creating resources", error });
  }
}

export async function deleteAllResources(req: Request, res: Response) {
  try {
    const resourcesSnapshot = await db.collection("resources").get();
    const deletePromises = resourcesSnapshot.docs.map((doc) =>
      doc.ref.delete()
    );
    await Promise.all(deletePromises);

    res.status(200).json({ message: "All resources deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting resources", error });
  }
}
