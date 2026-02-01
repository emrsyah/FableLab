"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "./password-input"
import { SocialButton } from "./social-button"
import { AuthDivider } from "./auth-divider"

interface LoginFormProps {
  onSuccess?: () => void
}

/**
 * Login form component with email/password and social login options.
 * Follows the Figma design with pill-shaped submit button.
 */
export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<"google" | "microsoft" | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/home",
      })

      if (error) {
        setError(error.message || "Invalid email or password")
      } else {
        onSuccess?.()
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "microsoft") => {
    setSocialLoading(provider)
    setError("")

    try {
      if (provider === "google") {
        await authClient.signIn.social({
          provider: "google",
          callbackURL: "/home",
        })
      } else {
        // Microsoft OAuth - would need to be configured in Better Auth
        setError("Microsoft login is not yet available")
        setSocialLoading(null)
      }
    } catch (err) {
      setError(`${provider === "google" ? "Google" : "Microsoft"} sign in failed`)
      console.error(err)
      setSocialLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Welcome Back to FableLab AI 👋
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter Your Email"
            className="h-12 w-full rounded-full border border-gray-200 bg-white px-4 text-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter Your Password"
            minLength={8}
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-500 hover:text-blue-600"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="h-12 w-full text-base rounded-full bg-[radial-gradient(ellipse_at_center,#6FA0F6_0%,#3C7AE8_80%)] text-white shadow-md hover:shadow-[0_0_20px_rgba(111,160,246,0.6)] hover:scale-[1.02] hover:brightness-105 border border-[#6FA0F6] transition-all duration-300 transform"
        >
          {loading ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      {/* Divider */}
      <AuthDivider />

      {/* Social Login Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <SocialButton
          provider="google"
          onClick={() => handleSocialLogin("google")}
          loading={socialLoading === "google"}
          disabled={loading || socialLoading !== null}
        />
        <SocialButton
          provider="microsoft"
          onClick={() => handleSocialLogin("microsoft")}
          loading={socialLoading === "microsoft"}
          disabled={loading || socialLoading !== null}
        />
      </div>

      {/* Register Link */}
      <p className="text-center text-sm text-gray-600">
        Don&apos;t Have an Account?{" "}
        <Link
          href="/register"
          className="font-medium text-blue-500 hover:text-blue-600 hover:underline"
        >
          Register Here
        </Link>
      </p>
    </div>
  )
}
