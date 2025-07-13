"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Play,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Crown,
  Edit,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "creator",
  });

  // Redirect if user is already logged in
  if (user) {
    router.push("/dashboard");
    
  }

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [],
  });

  const checkPasswordStrength = (password: string) => {
    let score = 0;
    const feedback = [];

    if (password.length >= 8) score++;
    else feedback.push("At least 8 characters");

    if (/[A-Z]/.test(password)) score++;
    else feedback.push("One uppercase letter");

    if (/[a-z]/.test(password)) score++;
    else feedback.push("One lowercase letter");

    if (/\d/.test(password)) score++;
    else feedback.push("One number");

    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push("One special character");

    setPasswordStrength({ score, feedback });
  };

  const handlePasswordChange = (password: string) => {
    setFormData((prev) => ({ ...prev, password }));
    checkPasswordStrength(password);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 2) return "bg-red-500";
    if (passwordStrength.score <= 3) return "bg-yellow-500";
    if (passwordStrength.score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 2) return "Weak";
    if (passwordStrength.score <= 3) return "Fair";
    if (passwordStrength.score <= 4) return "Good";
    return "Strong";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      return;
    }

    if (!acceptTerms) {
      return;
    }

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role as "creator" | "editor" | "manager",
      });
      router.push("/dashboard");
    } catch (error) {
      // Error is handled by the store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Join VideoFlow
          </h1>
          <p className="text-gray-600 text-sm mt-2">
            Create your account to get started
          </p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-sm text-center">
              Fill in your details to create your VideoFlow account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter your full name"
                  required
                  disabled={isLoading}
                  className="h-10 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  className="h-10 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Create a password"
                    required
                    disabled={isLoading}
                    className="h-10 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-10 w-10 px-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>

                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${getPasswordStrengthColor()}`}
                          style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <p className="text-xs text-gray-500">
                        Missing: {passwordStrength.feedback.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm your password"
                    required
                    disabled={isLoading}
                    className="h-10 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-10 w-10 px-0 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      Passwords do not match
                    </p>
                  )}
                {formData.confirmPassword &&
                  formData.password === formData.confirmPassword && (
                    <p className="text-xs text-green-600 mt-1 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Passwords match
                    </p>
                  )}
              </div>

              <div>
                <Label className="text-sm font-medium">Account Type</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, role: value }))
                  }
                  className="mt-3 space-y-3"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
                    <RadioGroupItem value="creator" id="creator" />
                    <Crown className="w-5 h-5 text-indigo-600" />
                    <Label htmlFor="creator" className="cursor-pointer flex-1">
                      <div>
                        <div className="font-medium text-gray-900">Creator</div>
                        <div className="text-xs text-gray-500">
                          Manage your own channel and team
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
                    <RadioGroupItem value="editor" id="editor" />
                    <Edit className="w-5 h-5 text-purple-600" />
                    <Label htmlFor="editor" className="cursor-pointer flex-1">
                      <div>
                        <div className="font-medium text-gray-900">Editor</div>
                        <div className="text-xs text-gray-500">
                          Upload and edit videos for creators
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 hover:border-indigo-300 transition-colors">
                    <RadioGroupItem value="manager" id="manager" />
                    <Settings className="w-5 h-5 text-green-600" />
                    <Label htmlFor="manager" className="cursor-pointer flex-1">
                      <div>
                        <div className="font-medium text-gray-900">Manager</div>
                        <div className="text-xs text-gray-500">
                          Manage team operations and analytics
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={setAcceptTerms}
                />
                <Label htmlFor="terms" className="text-xs cursor-pointer">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-indigo-600 hover:text-indigo-500 underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-indigo-600 hover:text-indigo-500 underline"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={
                  isLoading ||
                  formData.password !== formData.confirmPassword ||
                  !acceptTerms ||
                  passwordStrength.score < 3
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
