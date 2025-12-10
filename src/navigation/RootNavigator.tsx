import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootStackParamList } from "./types";
import CustomBottomTabBar from "../components/CustomBottomTabBar";
import { useAuthStore } from "../state/authStore";

// Screens
import HomeScreen from "../screens/HomeScreen";
import LearnScreen from "../screens/LearnScreen";
import MyTripsScreen from "../screens/MyTripsScreen";
import CommunityTopTabsNavigator from "./CommunityTopTabsNavigator";
import FirstAidScreen from "../screens/FirstAidScreen";
import CreateTripScreen from "../screens/CreateTripScreen";
import TripDetailScreen from "../screens/TripDetailScreen";
import ParksBrowseScreen from "../screens/ParksBrowseScreen";
import GearListsScreen from "../screens/GearListsScreen";
import CreateGearListScreen from "../screens/CreateGearListScreen";
import GearListDetailScreen from "../screens/GearListDetailScreen";
import MyCampsiteScreen from "../screens/MyCampsiteScreen";
import MyCampgroundScreen from "../screens/MyCampgroundScreen";
import AddCamperScreen from "../screens/AddCamperScreen";
import EditCamperScreen from "../screens/EditCamperScreen";
import AddPeopleToTripScreen from "../screens/AddPeopleToTripScreen";
import AuthLanding from "../screens/AuthLanding";
import PackingListScreen from "../screens/PackingListScreen";
import MealPlanningScreen from "../screens/MealPlanningScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import PaywallScreen from "../screens/PaywallScreen";
import ModuleDetailScreen from "../screens/ModuleDetailScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import SettingsScreen from "../screens/SettingsScreen";

// Utility screens
import SeedDataScreen from "../screens/SeedDataScreen";

// Community screens
import AskQuestionModal from "../screens/community/AskQuestionModal";
import ThreadDetailScreen from "../screens/community/ThreadDetailScreen";
import TipsListScreen from "../screens/community/TipsListScreen";
import TipDetailScreen from "../screens/community/TipDetailScreen";
import CreateTipScreen from "../screens/community/CreateTipScreen";
import GearReviewsListScreen from "../screens/community/GearReviewsListScreen";
import GearReviewDetailScreen from "../screens/community/GearReviewDetailScreen";
import CreateGearReviewScreen from "../screens/community/CreateGearReviewScreen";
import QuestionsListScreen from "../screens/community/QuestionsListScreen";
import QuestionDetailScreen from "../screens/community/QuestionDetailScreen";
import CreateQuestionScreen from "../screens/community/CreateQuestionScreen";
import PhotosListScreen from "../screens/community/PhotosListScreen";
import PhotoDetailScreen from "../screens/community/PhotoDetailScreen";
import UploadPhotoScreen from "../screens/community/UploadPhotoScreen";
import FeedbackListScreen from "../screens/community/FeedbackListScreen";
import FeedbackDetailScreen from "../screens/community/FeedbackDetailScreen";
import CreateFeedbackScreen from "../screens/community/CreateFeedbackScreen";

// Gear Closet screens
import MyGearClosetScreen from "../screens/MyGearClosetScreen";
import AddGearScreen from "../screens/AddGearScreen";
import EditGearScreen from "../screens/EditGearScreen";
import GearDetailScreen from "../screens/GearDetailScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

// Admin screens
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import AdminReportsScreen from "../screens/AdminReportsScreen";
import AdminUsersScreen from "../screens/AdminUsersScreen";
import AdminSubscriptionsScreen from "../screens/AdminSubscriptionsScreen";
import AdminPhotosScreen from "../screens/AdminPhotosScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const PlanStack = createNativeStackNavigator();

function PlanStackNavigator() {
  return (
    <PlanStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <PlanStack.Screen name="MyTrips" component={MyTripsScreen} />
      <PlanStack.Screen name="ParksBrowse" component={ParksBrowseScreen} />
    </PlanStack.Navigator>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
      <Tab.Screen name="Plan" component={PlanStackNavigator} />
      <Tab.Screen name="Connect" component={CommunityTopTabsNavigator} />
      <Tab.Screen name="FirstAid" component={FirstAidScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
      initialRouteName={user ? "HomeTabs" : "Auth"}
    >
      <Stack.Screen name="Auth" component={AuthLanding} options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} />
      <Stack.Screen name="GearLists" component={GearListsScreen} />
      <Stack.Screen name="CreateGearList" component={CreateGearListScreen} />
      <Stack.Screen name="GearListDetail" component={GearListDetailScreen} />
      <Stack.Screen name="Account" component={MyCampsiteScreen} />
      <Stack.Screen name="MyCampground" component={MyCampgroundScreen} options={{ title: "My Campground" }} />
      <Stack.Screen name="AddCamper" component={AddCamperScreen} />
      <Stack.Screen name="EditCamper" component={EditCamperScreen} />
      <Stack.Screen name="AddPeopleToTrip" component={AddPeopleToTripScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SeedData" component={SeedDataScreen} />

      {/* Learning */}
      <Stack.Screen name="ModuleDetail" component={ModuleDetailScreen} />

      {/* Subscription */}
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      {/* Trip Planning screens */}
      <Stack.Screen name="PackingList" component={PackingListScreen} />
      <Stack.Screen name="MealPlanning" component={MealPlanningScreen} />
      <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
      <Stack.Screen name="MealPlan" component={MyCampsiteScreen} />

      {/* Community screens */}
      <Stack.Screen name="AskQuestionModal" component={AskQuestionModal} />
      <Stack.Screen name="ThreadDetail" component={ThreadDetailScreen} />

      {/* Tips */}
      <Stack.Screen name="TipsListScreen" component={TipsListScreen} />
      <Stack.Screen name="TipDetail" component={TipDetailScreen} />
      <Stack.Screen name="CreateTip" component={CreateTipScreen} />

      {/* Gear Reviews */}
      <Stack.Screen name="GearReviewsListScreen" component={GearReviewsListScreen} />
      <Stack.Screen name="GearReviewDetail" component={GearReviewDetailScreen} />
      <Stack.Screen name="CreateGearReview" component={CreateGearReviewScreen} />
      <Stack.Screen name="SubmitGearReview" component={CreateGearReviewScreen} />

      {/* Questions/Ask */}
      <Stack.Screen name="QuestionsListScreen" component={QuestionsListScreen} />
      <Stack.Screen name="QuestionDetail" component={QuestionDetailScreen} />
      <Stack.Screen name="CreateQuestion" component={CreateQuestionScreen} />
      <Stack.Screen name="AskQuestion" component={CreateQuestionScreen} />

      {/* Photos */}
      <Stack.Screen name="PhotosListScreen" component={PhotosListScreen} />
      <Stack.Screen name="PhotoDetail" component={PhotoDetailScreen} />
      <Stack.Screen name="UploadPhoto" component={UploadPhotoScreen} />

      {/* Feedback */}
      <Stack.Screen name="FeedbackListScreen" component={FeedbackListScreen} />
      <Stack.Screen name="FeedbackDetail" component={FeedbackDetailScreen} />
      <Stack.Screen name="CreateFeedback" component={CreateFeedbackScreen} />

      {/* Gear Closet */}
      <Stack.Screen name="MyGearCloset" component={MyGearClosetScreen} />
      <Stack.Screen name="AddGear" component={AddGearScreen} />
      <Stack.Screen name="EditGear" component={EditGearScreen} />
      <Stack.Screen name="GearDetail" component={GearDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />

      {/* Admin screens */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminSubscriptions" component={AdminSubscriptionsScreen} />
      <Stack.Screen name="AdminPhotos" component={AdminPhotosScreen} />
    </Stack.Navigator>
  );
}
