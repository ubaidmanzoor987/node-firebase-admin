// src/index.ts
import express from "express";
import superAdminRoutes from "./routes/superAdminRoutes";
import areaOfFocusRoutes from "./routes/areaOfFocusRoutes";
import tagRoutes from "./routes/tagRoutes";
import resourceRoutes from "./routes/resourceRoutes";
import moduleRoutes from "./routes/moduleRoutes";
import assessmentRoutes from "./routes/assessmentRoutes";
import userRoutes from "./routes/userRoute";
import lifeEventRoutes from "./routes/lifeEventRoutes";
import dailyModdCheckInRoute from "./routes/dailyModdCheckInRoute";
import activitiesWithCheckInsRoute from "./routes/activitiesWithCheckIns";
import connectionRequestsRoute from "./routes/connectionRequestsRoute";
import notesRoute from "./routes/notesRoute";

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Routes
app.use("/super-admin", superAdminRoutes);
app.use("/area-of-focuses", areaOfFocusRoutes);
app.use("/tags", tagRoutes);
app.use("/resources", resourceRoutes);
app.use("/modules", moduleRoutes);
app.use("/assessments", assessmentRoutes);
app.use("/life-events", lifeEventRoutes);
app.use("/users", userRoutes);
app.use("/mood-check-ins", dailyModdCheckInRoute);
app.use("/activity-check-ins", activitiesWithCheckInsRoute);
app.use("/connection-requests", connectionRequestsRoute);
app.use("/notes", notesRoute);

const PORT = process.env.PORT || 7355;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
