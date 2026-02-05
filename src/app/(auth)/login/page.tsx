import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { MarketingCarousel } from "@/components/auth/marketing-carousel";

export const metadata = {
  title: "Login | FableLab AI",
  description: "Sign in to FableLab AI - K12 STEM Learning AI Playground",
};

export const carouselImages = [
  {
    src: "/images/auth/carousel-1.png",
    alt: "FableLab AI mascot - a friendly science beaker character",
  },
  {
    src: "/images/auth/carousel-2.png",
    alt: "FableLab AI dashboard preview showing interactive lessons",
  },
  {
    src: "/images/auth/carousel-3.png",
    alt: "Students exploring science and math concepts",
  },
];

export default function LoginPage() {
  return (
    <AuthLayout
      marketingContent={<MarketingCarousel images={carouselImages} />}
    >
      <LoginForm />
    </AuthLayout>
  );
}
