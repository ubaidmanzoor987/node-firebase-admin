import { DocumentReference, Timestamp } from "firebase-admin/firestore";

/**** Collections ****/
interface User {
  id: DocumentReference;

  role: EUserRole;
  isSuperAdmin: boolean; // Only applicable to role == 'Admin'
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  areasOfFocus: DocumentReference[]; // Ref to AreaOfFocus
  subscription: EUserSubscription;
  presetActivities: UserPresentActivity[];
  healthcareProviders: HaealthCareFriend[]; // Ref to Users
  supportingFriends: SupportingFriend[]; // Ref to Users
  favorites: UserFavorite; // Ref to any collection

  contactInfo: UserContactInfo | null; // Only applicable to role == "Healthcare Provider"
  professionalCredentials: UserProfessionalCredentials | null; // Only applicable to role == "Healthcare Provider"
  areasOfExpertise: DocumentReference[]; // Ref to AreaOfFocus // Only applicable to role == "Healthcare Provider"
  notificationSettings: UserNotificationSettings | null; // Only applicable to role == "Healthcare Provider"
  patients: DocumentReference[]; // Ref to Users

  currentStatus: UserStatus;
  statusHistory: UserStatus[]; // history of status changes

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Pateint
interface DailyMoodCheckin {
  id: DocumentReference;

  mood: EMood;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Pateint
interface DailyActivityCheckin {
  id: DocumentReference;

  activityId: DocumentReference; // Ref to UserActitity

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface ConnectionRequest {
  id: DocumentReference;

  requestedBy: DocumentReference; // Ref to User;
  requestedUser?: DocumentReference; // Ref to User;
  requestedUserEmail?: string; // For inviting Users not signed up to the app
  requestedUserPhone?: string; // For inviting Users not signed up to the app
  status: EConnectionRequestStatus;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Admin
interface AreaOfFocus {
  id: DocumentReference;
  name: string;

  createdBy: DocumentReference; // Ref to User role == 'Admin'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Admin
interface Tag {
  id: DocumentReference;
  name: string;

  createdBy: DocumentReference; // Ref to User role == 'Admin'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Admin
interface Assessment {
  id: DocumentReference;

  title: string;
  areaOfFocus: DocumentReference; // Ref to AreaOfFocus
  frequency: EAssessmentFrequency; // Assessment score
  credits: string;
  scoringParameters: AssessmentScoringParameter[];
  questions: AssessmentQuestion[];

  createdBy: DocumentReference; // Ref to User role == 'Admin'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Admin
interface Resource {
  id: DocumentReference;
  type: EResourceType;

  title: string;
  areaOfFocus: DocumentReference[]; // Ref to Tag/AreaOfFocus
  tags: DocumentReference[]; // Ref to Tag/AreaOfFocus
  imageUrl: string;
  content: string;

  createdBy: DocumentReference; // Ref to User role == 'Admin'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Admin
interface Module {
  id: DocumentReference;
  type: EResourceType;

  title: string;
  tags: DocumentReference[]; // Ref to Tag/AreaOfFocus
  imageUrl: string;
  pages: ModulePage[];

  createdBy: DocumentReference; // Ref to User role == 'Admin'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Admin
interface Rule {
  id: DocumentReference;

  title: string;
  trigger: ERuleTrigger;

  parameters: RuleParameter;
  actions: RuleAction;

  createdBy: DocumentReference; // Ref to User role == 'Admin'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Admin
interface Activity {
  id: DocumentReference;

  name: string;
  iconUrl: string;

  createdBy: DocumentReference; // Ref to User role == 'Admin'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Pateint
interface UserActivity {
  id: DocumentReference;

  name: string;
  iconUrl: string;
  url?: string;
  instructions?: string;
  daysOfWeek: EUserActivityDays[];
  sharedWith: DocumentReference[]; // Ref to Users
  count: number;

  // When activity is created from Module
  moduleId?: DocumentReference; // Ref to Module

  // When activity is created from Resource
  resourceId?: DocumentReference; // Ref to Resource

  createdBy: DocumentReference; // Ref to User role == 'Patient'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Pateint
interface LifeEvent {
  id: DocumentReference;

  event: string;
  date: DayMonthYear;
  showInAnalytics: boolean;
  sharedWith: DocumentReference[]; // Ref to Users

  createdBy: DocumentReference; // Ref to User role == 'Patient'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Pateint
interface AssessmentSession {
  id: DocumentReference;
  assessmentId: DocumentReference;

  qas: AssessmentSessionQAs[];
  score: number;

  createdBy: DocumentReference; // Ref to User role == 'Patient'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Created By Healthcare Provider
interface Note {
  id: DocumentReference;
  userId: DocumentReference; // Ref to User role == 'Patient'

  note: string;

  createdBy: DocumentReference; // Ref to User role == 'Healthcare Provider'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum NOTIFICATION_TYPE {
  ACTIVITY = "activity",
  CONNECTION = "connection",
  ASSESMENT = "assesment",
}

interface Notification {
  id: DocumentReference;

  userId: DocumentReference; // Ref to users
  ref: DocumentReference; // Ref to Collection about which the notification is
  title: string;
  message: string;
  isRead: boolean;
  type: string;
  createdBy: DocumentReference;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**** Types ****/
interface UserFavorite {
  type: "resource" | "activity"; // @TODO: Add all collection that can be favorited by users
  ref: DocumentReference[];
}

export interface AssessmentSessionQAs {
  questionNumber: number;
  type: EAssessmentQuestionType;
  question: string;
  response: AssessmentSessionQAsResponse;
}

interface AssessmentSessionQAsResponse {
  value: string;
  weight: number;
  isSelfHarm: boolean;
}

interface SupportingFriend {
  userId: DocumentReference; // Ref to User
  permissions: {
    mood: boolean;
    assessments: DocumentReference[]; // Ref to Assessments
    activities: string[];
  };
}

interface HaealthCareFriend {
  userId: DocumentReference; // Ref to User
  permissions: {
    mood: boolean;
    assessments: DocumentReference[]; // Ref to Assessments
    activities: string[];
  };
}

interface UserNotificationSettings {
  // Applies to all
  inApp: boolean;
  email: boolean;
  push: boolean;
  newConnectionRequest: boolean;
  moodDropAlert: boolean;
  AssessmentScoreDropAlert: boolean;

  // Applies to patients
  assessmentReminder: boolean;
  loginStreakAlert: boolean;
  supportNetworkActivity: boolean;
}

interface UserProfessionalCredentials {
  types: EUserHealthcareProviderType[];
  licenseNumber: string;
  licenseIssuedBy: string;
  licenseType: string;
  licenseExpiration: Timestamp;
}

interface UserContactInfo {
  organization: string;
  address: string;
  city: string;
  state: string;
  zip: number;
}

interface RuleParameter {
  // applies to trigger == 'Activity'
  streaksEqualTo?: number;

  // applies to trigger == 'Mood'
  selection?: EMood;
  frequency?: number;

  // applies to trigger == 'Assessment'
  type?: DocumentReference; // Ref to Assessment
  parameter?: ERuleParameterForAssessment;
  percentage?: number;
}

interface RuleAction {
  notificationToIndividual?: string;
  notificationToSupportingFriend?: string;
}

interface ModulePage {
  pageNumber: number;
  content: ModulePageContent[];
}

interface ModulePageContent {
  position: number;
  type: EModulePageContentType;
  title: string;
  placeHolderText: string;
}

interface AssessmentScoringParameter {
  parameter: string;
  range: {
    from: number;
    to: number;
  };
}

interface AssessmentQuestion {
  questionNumber: number;
  type: EAssessmentQuestionType;
  question: string;
  responses: AssessmentQuestionResponse[];
}

interface AssessmentQuestionResponse {
  value: string;
  weight: number;
  isSelfHarm: boolean;
  nextQuestion: number;
}

interface UserPresentActivity {
  iconUrl: string;
  name: string;
  instructions: string;
  url: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface UserStatus {
  status: "pending" | "active" | "inactive" | "under-review" | "deleted";
  suspensionReason?: string;
  adminId?: DocumentReference; // Refers to Admin responsible for updating the status
  date: Timestamp;
}

interface DayMonthYear {
  day: number;
  month: number;
  year: number;
}

// Enums
enum EModulePageContentType {
  SmallInputField = "Small Input Field",
  LargeInputField = "Large Input Field",
  Image = "Image",
  Text = "Text",
}

enum EUserRole {
  Individual = "Individual",
  SupportingFriend = "Supporting Friend",
  HealthcareProvider = "Healthcare Provider",
  Admin = "Admin",
}

enum EUserSubscription {
  Expired = "Expired", // Switch to this when trial is expired or subscription is finished
  Trial = "Trial",
  Subscribed = "Subscribed",
}

enum EAssessmentFrequency {
  EveryWeek = "Every Week",
  EveryTwoWeeks = "Every 2 Weeks",
  EveryThreeWeeks = "Every 3 Weeks",
  EveryMonth = "Every Month",
}

enum EAssessmentQuestionType {
  TrueFalse = "True False",
  MultipleChoice = "Multiple Choice",
  LikertScale = "Likert Scale",
  OpenEnded = "Open Ended",
}

enum EResourceType {
  Text = "Text",
  Video = "Video",
}

enum ERuleTrigger {
  Activity = "Activity",
  Assessment = "Assessment",
  Mood = "Mood",
}

enum EMood {
  Great = "Great",
  Good = "Good",
  Ok = "Ok",
  Terrible = "Terrible",
  Bad = "Bad",
}

enum ERuleParameterForAssessment {
  ScoreThreshold = "Score Threshold",
  Improvement = "Improvement",
  Decline = "Decline",
}

enum EUserHealthcareProviderType {
  Clinician = "Clinician",
  Prescriber = "Prescriber",
  GeneralPractitioner = "General Practitioner",
}

enum EConnectionRequestStatus {
  Pending = "Pending",
  Accepted = "Accepted",
  Rejected = "Rejected",
}

enum EUserActivityDays {
  Sun = "Sun",
  Mon = "Mon",
  Tue = "Tue",
  Thu = "Thu",
  Fri = "Fri",
  Sat = "Sat",
}

export {
  User,
  AreaOfFocus,
  Tag,
  Resource,
  Assessment,
  Module,
  Rule,
  Activity,
  ConnectionRequest,
  DailyMoodCheckin as DailyCheckin,
  UserActivity,
  LifeEvent,
  AssessmentSession,
  DailyActivityCheckin,
  Notification,
  Note,
  EModulePageContentType,
  EUserRole,
  EUserSubscription,
  EAssessmentFrequency,
  EAssessmentQuestionType,
  EResourceType,
  ERuleTrigger,
  EMood,
  ERuleParameterForAssessment,
  EUserHealthcareProviderType,
  EConnectionRequestStatus,
  EUserActivityDays,
  SupportingFriend,
  HaealthCareFriend
};
