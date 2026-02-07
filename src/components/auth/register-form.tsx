"use client";

import { Loader2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { AuthDivider } from "./auth-divider";
import { SocialButton } from "./social-button";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | null>(null);
  const [error, setError] = useState("");

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { error } = await authClient.signIn.anonymous();

      if (error) {
        setError(error.message || "Failed to create guest account");
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    setSocialLoading(provider);
    setError("");

    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (err) {
      setError("Google sign in failed");
      console.error(err);
      setSocialLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          Create Account or Guest Access
        </h1>
        <p className="text-sm text-gray-500">Join FableLab to start learning</p>
      </div>

      {/* Social Login Buttons */}
      <div className="grid gap-3">
        <SocialButton
          provider="google"
          onClick={() => handleSocialLogin("google")}
          loading={socialLoading === "google"}
          disabled={loading || socialLoading !== null}
        />
      </div>

      {/* Divider */}
      <AuthDivider />

      {/* Anonymous Login */}
      <div className="space-y-4">
        <Button
          onClick={handleAnonymousLogin}
          className="h-11 w-full text-base rounded-full bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm border border-gray-200 transition-all duration-300 transform font-medium flex items-center justify-center gap-2"
          disabled={loading || socialLoading !== null}
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Creating guest account...
            </>
          ) : (
            <>
              <User className="size-5" />
              Continue as Guest
            </>
          )}
        </Button>
        <p className="text-center text-xs text-gray-500">
          Guest accounts allow instant access but may be limited until upgraded.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Login Link */}
      <p className="text-center text-sm text-gray-600 pt-2">
        Already Have an Account?{" "}
        <Link
          href="/login"
          className="font-medium text-blue-500 hover:text-blue-600 hover:underline"
        >
          Login Here
        </Link>
      </p>
    </div>
  );
}
