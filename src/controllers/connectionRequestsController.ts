import { Request, Response } from "express";
import { db } from "../firebase";
import { Timestamp } from "firebase-admin/firestore";
import {
  ConnectionRequest,
  EConnectionRequestStatus,
  Notification,
  NOTIFICATION_TYPE,
} from "../schema";

// Route to create a single connection request
export const createConnectionRequest = async (req: Request, res: Response) => {
  try {
    const { requestedBy, requestedUser, requestedUserEmail, requestedByName } =
      req.body;

    if (
      !requestedBy ||
      !requestedUser ||
      !requestedUserEmail ||
      !requestedByName
    ) {
      return res.status(400).json({
        message:
          "All fields are required. like requestedBy, requestedUser, requestedUserEmail, requestedByName",
      });
    }

    const connectionRequestData: Partial<ConnectionRequest> = {
      requestedBy: db.doc(`users/${requestedBy}`),
      requestedUser: db.doc(`users/${requestedUser}`),
      requestedUserEmail,
      status: EConnectionRequestStatus.Pending,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const connectionRequestsRef = db.collection("connectionRequests").doc();
    await connectionRequestsRef.set(connectionRequestData);

    const notificationRef = db.collection("notifications").doc();

    const notificationData: Partial<Notification> = {
      ref: db.doc(`connectionRequests/${connectionRequestsRef.id}`),
      id: db.doc(`notifications/${notificationRef.id}`),
      isRead: false,
      message: `You have a new connection request from a client ${requestedByName}`,
      title: "New Connection Request",
      type: NOTIFICATION_TYPE.CONNECTION,
      userId: db.doc(`users/${requestedUser}`),
      createdBy: db.doc(`users/${requestedBy}`),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await notificationRef.set(notificationData);

    res.status(201).json({
      message: "connectionRequests created successfully.",
      id: connectionRequestData.id,
      connectionRequestData: connectionRequestData,
    });
  } catch (error: any) {
    console.error("Error creating connectionRequestData:", error);
    res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};
