
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { AuthForm } from "@/components/AuthForm";

const Register = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4">
          <AuthForm type="register" />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Register;
