/**
 * Parenting Webinar Landing Page Configuration
 * 
 * Central configuration module for:
 * - Event Announcements (Zoom, Marathi Schedule Notice)
 * - Google Apps Script Registration Backend Endpoint
 * - WhatsApp VIP Group Invitation Link
 */

const CONFIG = {
  // Event Details
  event: {
    platform: "Zoom",
    scheduleNoticeMarathi: "वेबिनारची तारीख आणि वेळ लवकरच जाहीर करण्यात येईल (नोंदणीकृत पालकांना व्हॉट्सॲपवर कळवले जाईल).",
    durationNoticeMarathi: "कालावधी: अंदाजे ९० मिनिटे"
  },

  // Backend Lead Storage (Google Apps Script Webhook URL)
  // -------------------------------------------------------------
  // Deployed Google Apps Script Web App for Pranurja Parenting Webinar
  // Target Sheet: 'All Leads' tab
  // Required fields: parentName, whatsappNumber, childAge, city, reason, consent, leadSource, campaignName
  googleSheetEndpoint: "https://script.google.com/macros/s/AKfycbzFgkKj3LGEI--AusQxTU_3kGUYRiGol9tiatYQA-punVJ7N9UtzTb3MDd5BVHlgUs/exec",

  // WhatsApp VIP Group Invitation Link
  // -------------------------------------------------------------
  // Finalized official WhatsApp community group invitation link.
  // Query parameters preserved in full.
  // The WhatsApp button will ONLY be displayed after a successful backend confirmation (success: true).
  whatsappGroupUrl: "https://chat.whatsapp.com/EU2pnWPRErt4nmVjr8lSr3?s=cl&p=i&mlu=4&ilr=4&iam=2"
};

// Prevent accidental mutation in runtime
if (typeof Object.freeze === "function") {
  Object.freeze(CONFIG.event);
  Object.freeze(CONFIG);
}
