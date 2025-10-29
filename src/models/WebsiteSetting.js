import mongoose from "mongoose";

const socialSchema = new mongoose.Schema({
  platform: { type: String, required: true }, // e.g., "facebook", "twitter"
  url: { type: String, required: true },
});

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String }, // e.g., "Customer", "Client"
  rating: { type: Number, min: 1, max: 5 },
  comment: { type: String },
  image: { type: String }, // optional reviewer photo
});

const websiteSettingSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      required: true,
      default: "My Website",
    },
    logo: {
      type: String,
      default: "",
    },
    favicon: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      default: "",
    },
    contactPhone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    aboutUs: {
      type: String,
      default: "",
    },
    socials: [socialSchema], // e.g. [{ platform: "facebook", url: "https://facebook.com" }]
    faqs: [faqSchema], // list of FAQs
    reviews: [reviewSchema], // customer reviews
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      keywords: [{ type: String }],
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  { timestamps: true }
);

const WebsiteSetting = mongoose.model("WebsiteSetting", websiteSettingSchema);
export default WebsiteSetting;
