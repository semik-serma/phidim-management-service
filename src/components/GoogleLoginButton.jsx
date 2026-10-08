'use client';

import { GoogleLogin } from "@react-oauth/google";
import { FaGoogle } from "react-icons/fa";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "@/lib/api";

const GoogleLoginButton = () => {
  const router = useRouter();
  const containerRef = useRef(null);
  const [width, setWidth] = useState(300);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.offsetWidth);
    }
  }, []);

  const handleSuccess = async (credentialResponse) => {
    try {
      const url = `${API_BASE_URL}/auth/google`;
      const res = await axios.post(
        url,
        { token: credentialResponse.credential },
        { withCredentials: true }
      );

      const authUser = res.data?.data?.user || res.data?.user;
      if (authUser) {
        localStorage.setItem('auth_user', JSON.stringify(authUser));
      }

      console.log("google login response:", res.data);
      toast.success("Signed in with Google successfully!");
      router.push("/dashboard");
    } catch (err) {
      console.error("Google login failed:", err);
      toast.error(err.response?.data?.message || "Google login failed");
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[42px]">
      {/* Visible styled button (decorative only) */}
      <button
        type="button"
        tabIndex={-1}
        className="absolute inset-0 w-full flex items-center justify-center gap-2.5 bg-white text-neutral-950 border border-neutral-300 text-[14.5px] font-medium cursor-pointer transition-colors hover:border-neutral-950 hover:bg-neutral-50 pointer-events-none"
      >
        <FaGoogle className="text-[15px]" />
        Continue with Google
      </button>

      {/* Real Google button, invisible, stacked on top to receive the actual click */}
      <div className="absolute inset-0 opacity-0 overflow-hidden">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Google login failed")}
          width={width.toString()}
        />
      </div>
    </div>
  );
};

export default GoogleLoginButton;