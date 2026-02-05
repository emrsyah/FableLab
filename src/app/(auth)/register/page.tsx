import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/auth-layout";
import { MarketingCarousel } from "@/components/auth/marketing-carousel";
import { RegisterForm } from "@/components/auth/register-form";
import { carouselImages } from "../login/page"; // Reuse images from login page

export const metadata: Metadata = {
  title: "Register | FableLab AI",
  description:
    "Create your FableLab AI account and start your learning journey.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      marketingContent={<MarketingCarousel images={carouselImages} />}
    >
      <RegisterForm />
    </AuthLayout>
  );
}
