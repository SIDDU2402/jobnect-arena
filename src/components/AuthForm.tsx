
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { EyeIcon, EyeOffIcon, Briefcase, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

type AuthFormProps = {
  type: "login" | "register";
};

export const AuthForm = ({ type }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"employer" | "employee" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // For demo purposes only - simulating API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (type === "login") {
        toast({
          title: "Logged in successfully",
          description: "Welcome back to JobNect!",
        });
      } else {
        toast({
          title: "Account created successfully",
          description: "Welcome to JobNect!",
        });
      }
      
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Authentication error",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">
          {type === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-muted-foreground">
          {type === "login"
            ? "Enter your credentials to access your account"
            : "Fill in your details to get started with JobNect"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {type === "register" && (
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-11 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {type === "register" && (
          <div className="space-y-3">
            <Label>I am a</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={role === "employer" ? "default" : "outline"}
                className={`h-20 flex flex-col items-center justify-center space-y-1 ${
                  role === "employer" ? "" : "hover:bg-secondary/50"
                }`}
                onClick={() => setRole("employer")}
              >
                <Briefcase className="h-6 w-6" />
                <span>Employer</span>
              </Button>
              <Button
                type="button"
                variant={role === "employee" ? "default" : "outline"}
                className={`h-20 flex flex-col items-center justify-center space-y-1 ${
                  role === "employee" ? "" : "hover:bg-secondary/50"
                }`}
                onClick={() => setRole("employee")}
              >
                <User className="h-6 w-6" />
                <span>Job Seeker</span>
              </Button>
            </div>
          </div>
        )}

        {type === "login" && (
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11"
          disabled={isLoading || (type === "register" && !role)}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </div>
          ) : type === "login" ? (
            "Log in"
          ) : (
            "Create account"
          )}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          {type === "login" ? (
            <>
              Don't have an account?{" "}
              <Link to="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link>
            </>
          )}
        </div>
      </form>
    </div>
  );
};
