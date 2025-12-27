import { NativeStackScreenProps, NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

export type RootStackParamList = {
  HomeTabs: undefined;
  Home: undefined;
  Learn: undefined;
  Plan: undefined;
  Connect: undefined;
  FirstAid: undefined;
  MyTrips: undefined;
  CreateTrip: undefined;
  TripDetail: { tripId: string; showItineraryPrompt?: boolean };
  Parks: undefined;
  ParksBrowse: undefined;
  ParkDetail: { parkId: string };
  GearLists: undefined;
  GearListDetail: { listId: string };
  CreateGearList: { tripId?: string };
  Account: undefined;
  MyCampsite: undefined;
  MyCampground: undefined;
  AddCamper: undefined;
  EditCamper: { contactId: string };
  AddPeopleToTrip: { tripId: string };
  Notifications: undefined;
  Settings: undefined;
  Auth: undefined;
  Paywall: undefined;
  SeedData: undefined;

  // Gear Closet
  MyGearCloset: undefined;
  AddGear: undefined;
  EditGear: { gearId: string };
  GearDetail: { gearId: string };
  EditProfile: undefined;

  // Learning
  ModuleDetail: { moduleId: string };

  // Plan section with trip context
  PackingList: { tripId: string };
  PackingListGenerate: { tripId: string };
  MealPlan: { tripId: string };

  // New Packing List screens (local-first)
  PackingListCreate: undefined;
  PackingListEditor: { listId: string };
  MealPlanning: { tripId: string };
  ShoppingList: { tripId: string };
  AddMeal: { tripId: string; category?: "breakfast" | "lunch" | "dinner" | "snack" };
  MealLibrary: { tripId: string; category?: "breakfast" | "lunch" | "dinner" | "snack" };
  AddPackingItem: { tripId: string; category?: string };

  // Community screens
  Community: { initialTab?: "tips" | "connect" | "images" | "feedback" | "gear" };

  // Tips
  TipDetail: { tipId: string };
  CreateTip: undefined;
  TipsListScreen: undefined;

  // Gear Reviews
  GearReviewDetail: { reviewId: string };
  CreateGearReview: undefined;
  SubmitGearReview: undefined;
  GearReviewsListScreen: undefined;

  // Questions/Ask
  QuestionDetail: { questionId: string };
  CreateQuestion: undefined;
  AskQuestion: undefined;
  AskQuestionModal: undefined;
  ThreadDetail: { questionId: string };
  QuestionsListScreen: undefined;

  // Photos/Stories
  PhotoDetail: { storyId: string };
  UploadPhoto: undefined;
  PhotoComposer: { postType?: string };
  PhotosListScreen: undefined;

  // Feedback
  FeedbackDetail: { postId: string };
  CreateFeedback: undefined;
  FeedbackListScreen: undefined;

  // Admin screens
  AdminDashboard: undefined;
  AdminReports: undefined;
  AdminUsers: undefined;
  AdminSubscriptions: undefined;
  AdminPhotos: undefined;
  AdminContent: undefined;
  AdminBanned: undefined;

  // Invitation
  AcceptInvitation: { invitationToken: string };
  AcceptInvite: { token: string };

  // Main tabs
  MainTabs: { screen: string; params?: any };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export type MainTabParamList = {
  Home: undefined;
  Learn: undefined;
  Plan: undefined;
  Community: { initialTab?: "tips" | "connect" | "images" | "feedback" | "gear" };
  FirstAid: undefined;
  Profile: { screen?: string };
};

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
export type MainTabRouteProp<T extends keyof MainTabParamList> = RouteProp<MainTabParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
